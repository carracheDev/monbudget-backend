import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TypeNotification } from '@prisma/client';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseService, // ✅ Ajouté
  ) {}

  async creerNotification(
    utilisateurId: string,
    titre: string,
    message: string,
    type: TypeNotification,
    donnees?: Record<string, any>,
  ) {
    return this.prisma.notification.create({
      data: {
        utilisateurId,
        titre,
        message,
        type,
        donnees: donnees ?? {},
      },
    });
  }

  async notifierBudgetDepasse(
    utilisateurId: string,
    categorieNom: string,
    pourcentage: number,
  ) {
    const titre = '⚠️ Budget dépassé';
    const message = `Vous avez atteint ${pourcentage.toFixed(0)}% de votre budget "${categorieNom}"`;

    this.logger.warn(`[Budget] ${message} — userId: ${utilisateurId}`);

    // ✅ 1. Sauvegarder la notification en base
    await this.creerNotification(
      utilisateurId,
      titre,
      message,
      TypeNotification.BUDGET,
      { pourcentage, categorieNom },
    );

    // ✅ 2. Envoyer le push FCM
    try {
      const user = await this.prisma.utilisateur.findUnique({
        where: { id: utilisateurId },
      });
      if (user?.fcmToken) {
        await this.firebase.sendNotification(user.fcmToken, titre, message);
        this.logger.log(`✅ Push FCM budget envoyé à userId: ${utilisateurId}`);
      } else {
        this.logger.warn(`⚠️ Pas de fcmToken pour userId: ${utilisateurId}`);
      }
    } catch (e) {
      this.logger.error(`❌ Erreur FCM budget: ${e.message}`);
    }
  }

  async getNotificationsNonLues(utilisateurId: string) {
    return this.prisma.notification.findMany({
      where: {
        utilisateurId,
        estLu: false,
        deletedAt: null,
      },
      orderBy: { dateCreation: 'desc' },
    });
  }

  async marquerCommeLue(notificationId: string, utilisateurId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        utilisateurId,
      },
      data: {
        estLu: true,
        dateLecture: new Date(),
      },
    });
  }

  async marquerToutesCommeLues(utilisateurId: string) {
    return this.prisma.notification.updateMany({
      where: {
        utilisateurId,
        estLu: false,
        deletedAt: null,
      },
      data: {
        estLu: true,
        dateLecture: new Date(),
      },
    });
  }

  async getNombreNonLues(utilisateurId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        utilisateurId,
        estLu: false,
        deletedAt: null,
      },
    });
  }

  async getAllNotifications(utilisateurId: string) {
    return this.prisma.notification.findMany({
      where: {
        utilisateurId,
        deletedAt: null,
      },
      orderBy: { dateCreation: 'desc' },
    });
  }

  async supprimerNotification(notificationId: string, utilisateurId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        utilisateurId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async supprimerNotificationsBudget(utilisateurId: string, categorieNom?: string) {
    return this.prisma.notification.updateMany({
      where: {
        utilisateurId,
        type: TypeNotification.BUDGET,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}