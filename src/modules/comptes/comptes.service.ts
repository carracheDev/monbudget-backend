import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompteDto } from './dto/create-compte.dto';
import { UpdateCompteDto } from './dto/update-compte.dto';

@Injectable()
export class ComptesService {
  constructor(private prisma: PrismaService) {}

  // Créer un compte
  async create(userId: string, dto: CreateCompteDto) {
    // Vérifier doublon seulement pour Mobile Money (numéro unique)
    if (dto.numeroTelephone) {
      const existant = await this.prisma.compte.findFirst({
        where: {
          utilisateurId: userId,
          numeroTelephone: dto.numeroTelephone,
          deletedAt: null,
        },
      });
      if (existant) {
        throw new ConflictException('Un compte avec ce numéro existe déjà');
      }
    }

    return await this.prisma.compte.create({
      data: {
        utilisateurId: userId,
        nom: dto.nom,
        type: dto.type,
        soldeInitial: dto.soldeInitial,
        solde: dto.soldeInitial, // ← solde = soldeInitial au départ
        devise: dto.devise ?? 'XOF',
        operateur: dto.operateur,
        numeroTelephone: dto.numeroTelephone,
      },
    });
  }

  // Lister tous les comptes
  async findAll(userId: string) {
    return this.prisma.compte.findMany({
      where: { utilisateurId: userId, deletedAt: null },
      orderBy: [{ estDefaut: 'desc' }, { dateCreation: 'asc' }],
    });
  }

  // Modifier un compte
  async update(userId: string, compteId: string, dto: UpdateCompteDto) {
    const compte = await this.prisma.compte.findFirst({
      where: { id: compteId, utilisateurId: userId, deletedAt: null },
    });

    if (!compte) {
      throw new NotFoundException('Compte introuvable');
    }

    return this.prisma.compte.update({
      where: { id: compteId },
      data: dto,
    });
  }

  // Soft delete
  async remove(userId: string, compteId: string) {
    const compte = await this.prisma.compte.findFirst({
      where: { id: compteId, utilisateurId: userId, deletedAt: null },
    });

    if (!compte) {
      throw new NotFoundException('Compte introuvable');
    }

    await this.prisma.compte.update({
      where: { id: compteId },
      data: { deletedAt: new Date() },
    });
  }

  // Définir un compte par défaut
  async setDefaut(userId: string, compteId: string) {
    // 1. Retirer le défaut de tous les comptes
    await this.prisma.compte.updateMany({
      where: { utilisateurId: userId },
      data: { estDefaut: false },
    });

    // 2. Définir ce compte comme défaut
    return this.prisma.compte.update({
      where: { id: compteId },
      data: { estDefaut: true },
    });
  }
}
