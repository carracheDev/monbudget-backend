import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { Prisma, TypeTransaction } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private firebase: FirebaseService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      let compteId = dto.compteId;
      if (!compteId) {
        const compteDefaut = await tx.compte.findFirst({
          where: { utilisateurId: userId, estDefaut: true, deletedAt: null },
        });
        if (!compteDefaut) {
          const nouveauCompte = await tx.compte.create({
            data: {
              nom: 'Compte principal',
              type: 'PRINCIPAL',
              estDefaut: true,
              utilisateurId: userId,
            },
          });
          compteId = nouveauCompte.id;
        } else {
          compteId = compteDefaut.id;
        }
      }
        const user = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
        });

        if (user?.fcmToken) {
        await this.firebase.sendNotification(
        user.fcmToken,
        '💸 Nouvelle transaction',
        `${dto.type === 'DEPENSE' ? '- ' : '+ '}${dto.montant} F enregistré`,
       );
     }

      const compte = await tx.compte.findFirst({
        where: { id: compteId, utilisateurId: userId, deletedAt: null },
      });
      if (!compte) {
        throw new NotFoundException('Compte non trouvé');
      }

      if (
        (dto.type === TypeTransaction.DEPENSE ||
          dto.type === TypeTransaction.TRANSFERT) &&
        compte.solde < dto.montant
      ) {
        throw new BadRequestException('Solde insuffisant');
      }

      const transaction = await tx.transaction.create({
        data: {
          montant: dto.montant,
          type: dto.type,
          description: dto.description,
          date: dto.date ? new Date(dto.date) : new Date(),
          utilisateurId: userId,
          categorieId: dto.categorieId,
          compteSourceId: compteId,
        },
      });

      const nouveauSolde =
        dto.type === TypeTransaction.REVENU
          ? compte.solde + dto.montant
          : compte.solde - dto.montant;

      await tx.compte.update({
        where: { id: compteId },
        data: { solde: nouveauSolde },
      });

      if (dto.type === TypeTransaction.DEPENSE && dto.categorieId) {
        await this.verifierBudget(tx, userId, dto.categorieId);
      }

      return transaction;
    });
  }

  async findAll(userId: string, filters?: FilterTransactionDto) {
    return this.prisma.transaction.findMany({
      where: {
        utilisateurId: userId,
        deletedAt: null,
        type: filters?.type,
        categorieId: filters?.categorieId,
        compteSourceId: filters?.compteId,
      },
      include: {
        categorie: true,
        compteSource: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async getTotalDepensesMois(userId: string) {
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const result = await this.prisma.transaction.aggregate({
      where: {
        utilisateurId: userId,
        type: TypeTransaction.DEPENSE,
        date: { gte: debutMois },
        deletedAt: null,
      },
      _sum: { montant: true },
    });

    return {
      totalDepenses: result._sum.montant ?? 0,
      mois: debutMois.toISOString().slice(0, 7),
    };
  }

  async getTotalRevenusMois(userId: string) {
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const result = await this.prisma.transaction.aggregate({
      where: {
        utilisateurId: userId,
        type: TypeTransaction.REVENU,
        date: { gte: debutMois },
        deletedAt: null,
      },
      _sum: { montant: true },
    });

    return {
      totalRevenus: result._sum.montant ?? 0,
      mois: debutMois.toISOString().slice(0, 7),
    };
  }

  async getResumeMois(userId: string) {
    const [depenses, revenus] = await Promise.all([
      this.getTotalDepensesMois(userId),
      this.getTotalRevenusMois(userId),
    ]);

    return {
      mois: depenses.mois,
      totalDepenses: depenses.totalDepenses,
      totalRevenus: revenus.totalRevenus,
      solde: revenus.totalRevenus - depenses.totalDepenses,
    };
  }

  private async verifierBudget(
    tx: Prisma.TransactionClient,
    userId: string,
    categorieId: string,
  ) {
    const budget = await tx.budget.findFirst({
      where: {
        utilisateurId: userId,
        categorieId,
        estActif: true,
        deletedAt: null,
      },
      include: { categorie: true },
    });

    if (!budget) return;

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const totalDepense = await tx.transaction.aggregate({
      where: {
        utilisateurId: userId,
        categorieId,
        type: TypeTransaction.DEPENSE,
        date: { gte: debutMois },
        deletedAt: null,
      },
      _sum: { montant: true },
    });

    const montantTotal = totalDepense._sum.montant ?? 0;
    const pourcentage = (montantTotal / budget.montantLimite) * 100;

    // ✅ Notifie à chaque dépense si >= 85% — simple et efficace
    if (pourcentage >= 85) {
      await this.notificationsService.notifierBudgetDepasse(
        userId,
        budget.categorie.nom,
        pourcentage,
      );
    }

    return { pourcentage, montantTotal, limite: budget.montantLimite };
  }
}