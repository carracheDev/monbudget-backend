import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRechargeDto } from './dto/create-recharge.dto';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { FlutterwaveService } from './flutterwave.service';

@Injectable()
export class PortefeuilleService {
  constructor(
    private prisma: PrismaService,
    private flutterwaveService: FlutterwaveService,
  ) {}

  async getPortefeuille(userId: string) {
    // Chercher le portefeuil
    let portefeuille = await this.prisma.portefeuille.findUnique({
      where: { utilisateurId: userId },
    });
    // S'il ,exsite pas on va créer
    if (!portefeuille) {
      portefeuille = await this.prisma.portefeuille.create({
        data: { utilisateurId: userId },
      });
    }
    return portefeuille;
  }
  // Recharger le portefeuille
  async recharger(userId: string, dto: CreateRechargeDto) {
    const portefeuille = await this.getPortefeuille(userId);

    const recharge = await this.prisma.recharge.create({
      data: {
        montant: dto.montant,
        operateur: dto.operateur,
        numeroTelephone: dto.numeroTelephone,
        utilisateurId: userId,
        statut: 'VALIDEE', // simulation
        dateValidation: new Date(),
      },
    });

    await this.prisma.portefeuille.update({
      where: { utilisateurId: userId },
      data: { solde: portefeuille.solde + dto.montant },
    });

    return recharge;
  }

  //Payer avec le portfeuille
  async payer(userId: string, dto: CreatePaiementDto) {
    // 1. Récupérer le portfeuille
    const portefeuille = await this.getPortefeuille(userId);

    // 2. Vérifier sole suffisant
    if (portefeuille.solde < dto.montant) {
      throw new BadRequestException('Solde portefeuille insuffisant');
    }

    // 3. Créer le paiement
    const paiement = await this.prisma.paiement.create({
      data: {
        montant: dto.montant,
        operateur: dto.operateur,
        numeroDestinataire: dto.numeroDestinataire,
        description: dto.description,
        utilisateurId: userId,
        statut: 'VALIDEE', // Simulation
        dateValidation: new Date(),
      },
    });

    // 4. Diminuer le solde
    await this.prisma.portefeuille.update({
      where: { utilisateurId: userId },
      data: { solde: portefeuille.solde - dto.montant },
    });
    return paiement;
  }

  // Historique des recharges
  async getRecharges(userId: string) {
    return this.prisma.recharge.findMany({
      where: { utilisateurId: userId },
      orderBy: { dateCreation: 'desc' },
    });
  }

  // Historique des paiements
  async getPaiement(userId: string) {
    return this.prisma.paiement.findMany({
      where: { utilisateurId: userId },
      orderBy: { dateCreation: 'desc' },
    });
  }
}
