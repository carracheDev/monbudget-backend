import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TypeNotification } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

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

    // TODO: Envoyer FCM push notification ici

    return this.creerNotification(
      utilisateurId,
      titre,
      message,
      TypeNotification.BUDGET,
      { pourcentage, categorieNom },
    );
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
}
