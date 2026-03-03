import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRechargeDto } from './dto/create-recharge.dto';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class PortefeuilleService {
  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseService, // ✅
  ) {}

  async getPortefeuille(userId: string) {
    let portefeuille = await this.prisma.portefeuille.findUnique({
      where: { utilisateurId: userId },
    });
    if (!portefeuille) {
      portefeuille = await this.prisma.portefeuille.create({
        data: { utilisateurId: userId },
      });
    }
    return portefeuille;
  }

  async recharger(userId: string, dto: CreateRechargeDto) {
    const portefeuille = await this.getPortefeuille(userId);

    const recharge = await this.prisma.recharge.create({
      data: {
        montant: dto.montant,
        operateur: dto.operateur,
        numeroTelephone: dto.numeroTelephone,
        utilisateurId: userId,
        statut: 'VALIDEE',
        dateValidation: new Date(),
      },
    });

    await this.prisma.portefeuille.update({
      where: { utilisateurId: userId },
      data: { solde: portefeuille.solde + dto.montant },
    });

    // ✅ Notification recharge
    try {
      const user = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
      });
      if (user?.fcmToken) {
        await this.firebase.sendNotification(
          user.fcmToken,
          '💰 Recharge confirmée',
          `Votre portefeuille a été rechargé de ${dto.montant} F via ${dto.operateur}`,
        );
      }
    } catch (e) {
      console.error('❌ Erreur notification recharge:', e);
    }

    return recharge;
  }

  async payer(userId: string, dto: CreatePaiementDto) {
    const portefeuille = await this.getPortefeuille(userId);

    if (portefeuille.solde < dto.montant) {
      throw new BadRequestException('Solde portefeuille insuffisant');
    }

    const paiement = await this.prisma.paiement.create({
      data: {
        montant: dto.montant,
        operateur: dto.operateur,
        numeroDestinataire: dto.numeroDestinataire,
        description: dto.description,
        utilisateurId: userId,
        statut: 'VALIDEE',
        dateValidation: new Date(),
      },
    });

    await this.prisma.portefeuille.update({
      where: { utilisateurId: userId },
      data: { solde: portefeuille.solde - dto.montant },
    });

    // ✅ Notification paiement
    try {
      const user = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
      });
      if (user?.fcmToken) {
        await this.firebase.sendNotification(
          user.fcmToken,
          '💳 Paiement effectué',
          `Paiement de ${dto.montant} F vers ${dto.numeroDestinataire} confirmé`,
        );
      }
    } catch (e) {
      console.error('❌ Erreur notification paiement:', e);
    }

    return paiement;
  }

  async getRecharges(userId: string) {
    return this.prisma.recharge.findMany({
      where: { utilisateurId: userId },
      orderBy: { dateCreation: 'desc' },
    });
  }

  async getPaiement(userId: string) {
    return this.prisma.paiement.findMany({
      where: { utilisateurId: userId },
      orderBy: { dateCreation: 'desc' },
    });
  }
}