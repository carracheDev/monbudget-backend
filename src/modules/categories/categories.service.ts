import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategorieDto } from './dto/create-categorie.dto';
import { Categorie } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // Créer une catégorie personnalisée pour l'utilisateur
  async create(userId: string, dto: CreateCategorieDto): Promise<Categorie> {
    // Vérifier si le nom existe déjà pour cet utilisateur
    const existante = await this.prisma.categorie.findFirst({
      where: {
        nom: dto.nom,
        utilisateurId: userId,
        deletedAt: null, // ← CORRIGÉ
      },
    });

    if (existante) {
      throw new ConflictException('Vous avez déjà une catégorie avec ce nom');
    }

    return this.prisma.categorie.create({
      data: {
        nom: dto.nom,
        icone: dto.icone || '📁',
        couleur: dto.couleur || '#888888',
        type: dto.type,
        utilisateurId: userId,
      },
    });
  }

  // Récupérer catégories système + personnelles de l'utilisateur
  async findAll(userId: string): Promise<Categorie[]> {
    return this.prisma.categorie.findMany({
      where: {
        OR: [
          { estDefaut: true, deletedAt: null }, // ← CORRIGÉ
          { utilisateurId: userId, deletedAt: null }, // ← CORRIGÉ
        ],
      },
      orderBy: [{ estDefaut: 'desc' }, { nom: 'asc' }],
    });
  }

  // Soft delete
  async remove(userId: string, categorieId: string): Promise<void> {
    const categorie = await this.prisma.categorie.findFirst({
      where: {
        id: categorieId,
        utilisateurId: userId,
        estDefaut: false,
        deletedAt: null,
      },
    });

    if (!categorie) {
      throw new NotFoundException('Catégorie non trouvée ou non supprimable');
    }

    // ← NOUVEAU : vérifier si des transactions utilisent cette catégorie
    const transactionsLiees = await this.prisma.transaction.count({
      where: { categorieId, deletedAt: null },
    });

    if (transactionsLiees > 0) {
      throw new BadRequestException(
        `Impossible de supprimer — ${transactionsLiees} transaction(s) utilisent cette catégorie`,
      );
    }

    await this.prisma.categorie.update({
      where: { id: categorieId },
      data: { deletedAt: new Date() },
    });
  }
}
