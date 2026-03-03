import { PrismaService } from '../../prisma/prisma.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { CreateObjectifDto } from './dto/create-objectif.dto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class EpargneService {
  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseService, // ✅ ajouté
  ) {}

  async create(userId: string, dto: CreateObjectifDto) {
    const existant = await this.prisma.objectifEpargne.findFirst({
      where: { nom: dto.nom, utilisateurId: userId, deletedAt: null },
    });
    if (existant) {
      throw new ConflictException('Un objectif avec ce nom existe déjà');
    }

    return this.prisma.objectifEpargne.create({
      data: {
        nom: dto.nom,
        icone: dto.icone,
        montantCible: dto.montantCible,
        dateEcheance: new Date(dto.dateEcheance),
        description: dto.description,
        utilisateurId: userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.objectifEpargne.findMany({
      where: { utilisateurId: userId, deletedAt: null },
      include: { contributions: true },
    });
  }

  async remove(userId: string, objectifId: string) {
    const objectif = await this.prisma.objectifEpargne.findFirst({
      where: { id: objectifId, utilisateurId: userId, deletedAt: null },
    });

    if (!objectif) throw new NotFoundException('Objectif introuvable');

    await this.prisma.objectifEpargne.update({
      where: { id: objectifId },
      data: { deletedAt: new Date() },
    });
  }

  async addContribution(userId: string, dto: CreateContributionDto) {
    const objectif = await this.prisma.objectifEpargne.findFirst({
      where: { id: dto.objectifId, utilisateurId: userId, deletedAt: null },
    });

    if (!objectif) throw new NotFoundException('Objectif introuvable');

    const contribution = await this.prisma.contribution.create({
      data: {
        montant: dto.montant,
        note: dto.note,
        objectifId: dto.objectifId,
      },
    });

    // ✅ Calculer le nouveau montant
    const nouveauMontant = objectif.montantActuel + dto.montant;
    const objectifAtteint = nouveauMontant >= objectif.montantCible;

    // ✅ Mettre à jour AVANT la notification
    await this.prisma.objectifEpargne.update({
      where: { id: dto.objectifId },
      data: {
        montantActuel: nouveauMontant,
        statut: objectifAtteint ? 'TERMINE' : 'ACTIF',
      },
    });

    // ✅ Notification APRÈS la mise à jour
    try {
      const user = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
      });
      if (user?.fcmToken) {
        if (objectifAtteint) {
          await this.firebase.sendNotification(
            user.fcmToken,
            '🎉 Objectif atteint !',
            `Bravo ! Vous avez atteint votre objectif "${objectif.nom}"`,
          );
        } else {
          await this.firebase.sendNotification(
            user.fcmToken,
            '🐷 Contribution ajoutée',
            `${dto.montant} F ajoutés à "${objectif.nom}"`,
          );
        }
      }
    } catch (e) {
      console.error('❌ Erreur notification épargne:', e);
    }

    return contribution;
  }
}