import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto) {
    // Vérifier si un budget existe déjà pour cette catégorie et période
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

    return this.prisma.budget.create({
      data: {
        montantLimite: dto.montantLimite,
        periode: dto.periode,
        categorieId: dto.categorieId,
        utilisateurId: userId,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : new Date(),
        dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
      },
      include: { categorie: true }, // retourne la catégorie dans la réponse
    });
  }

  async findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: {
        utilisateurId: userId,
        deletedAt: null,
      },
      include: { categorie: true },
    });
  }

  async remove(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: {
        id: budgetId,
        utilisateurId: userId,
        deletedAt: null,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget introuvable');
    }

    // Soft delete
    await this.prisma.budget.update({
      where: { id: budgetId },
      data: { deletedAt: new Date() },
    });
  }
}
