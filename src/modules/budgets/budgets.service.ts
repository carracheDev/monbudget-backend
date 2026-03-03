import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private firebase: FirebaseService, // ✅
  ) {}

  async create(userId: string, dto: CreateBudgetDto) {
    const existingBudget = await this.prisma.budget.findFirst({
      where: {
        utilisateurId: userId,
        categorieId: dto.categorieId,
        periode: dto.periode,
        deletedAt: null,
      },
    });

    if (existingBudget) {
      throw new ConflictException(
        'Un budget existe déjà pour cette catégorie et cette période',
      );
    }

    const budget = await this.prisma.budget.create({
      data: {
        montantLimite: dto.montantLimite,
        periode: dto.periode,
        categorieId: dto.categorieId,
        utilisateurId: userId,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : new Date(),
        dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
      },
      include: { categorie: true },
    });

    // ✅ Notification création budget
    try {
      const user = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
      });
      if (user?.fcmToken) {
        await this.firebase.sendNotification(
          user.fcmToken,
          '📊 Budget créé',
          `Budget "${budget.categorie.nom}" de ${dto.montantLimite} F créé avec succès`,
        );
      }
    } catch (e) {
      console.error('❌ Erreur notification budget:', e);
    }

    return budget;
  }

  async findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: { utilisateurId: userId, deletedAt: null },
      include: { categorie: true },
    });
  }

  async remove(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, utilisateurId: userId, deletedAt: null },
    });

    if (!budget) throw new NotFoundException('Budget introuvable');

    await this.prisma.budget.update({
      where: { id: budgetId },
      data: { deletedAt: new Date() },
    });

    await this.notificationsService.supprimerNotificationsBudget(userId);
  }
}