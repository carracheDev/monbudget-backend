import { PrismaService } from '../../prisma/prisma.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { CreateObjectifDto } from './dto/create-objectif.dto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class EpargneService {
  constructor(private prisma: PrismaService) {}

  // Créer un objectif
  async create(userId: string, dto: CreateObjectifDto) {
    // Vérifier si un objectif avec ce nom existe déjà
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
        dateEcheance: new Date(dto.dateEcheance), // ← convertir en Date
        description: dto.description,
        utilisateurId: userId,
      },
    });
  }

  // Lister tous les objectifs
  async findAll(userId: string) {
    return this.prisma.objectifEpargne.findMany({
      where: { utilisateurId: userId, deletedAt: null },
      include: { contributions: true }, // ← voir les versements
    });
  }

  // Supprimer un objectif (soft delete)
  async remove(userId: string, objectifId: string) {
    const objectif = await this.prisma.objectifEpargne.findFirst({
      where: { id: objectifId, utilisateurId: userId, deletedAt: null },
    });

    if (!objectif) {
      throw new NotFoundException('Objectif introuvable');
    }

    await this.prisma.objectifEpargne.update({
      where: { id: objectifId },
      data: { deletedAt: new Date() },
    });
  }

  // Ajouter une contribution à un objectif
  async addContribution(userId: string, dto: CreateContributionDto) {
    // Vérifier que l'objectif appartient à l'utilisateur
    const objectif = await this.prisma.objectifEpargne.findFirst({
      where: { id: dto.objectifId, utilisateurId: userId, deletedAt: null },
    });

    if (!objectif) {
      throw new NotFoundException('Objectif introuvable');
    }

    // Créer la contribution
    const contribution = await this.prisma.contribution.create({
      data: {
        montant: dto.montant,
        note: dto.note,
        objectifId: dto.objectifId,
      },
    });

    // Mettre à jour montantActuel de l'objectif
    const nouveauMontant = objectif.montantActuel + dto.montant;
    await this.prisma.objectifEpargne.update({
      where: { id: dto.objectifId },
      data: {
        montantActuel: nouveauMontant,
        // Si objectif atteint → statut TERMINE
        statut: nouveauMontant >= objectif.montantCible ? 'TERMINE' : 'ACTIF',
      },
    });

    return contribution;
  }
}
