import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterRapportDto } from './dto/filter-rapport.dto';
import { TypeTransaction } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import ExcelJS from 'exceljs';

@Injectable()
export class RapportsService {
  constructor(private prisma: PrismaService) {}

  // Calculer la date de début selon la période (méthode privée réutilisable)
  private getDebutPeriode(dto: FilterRapportDto): Date {
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);

    if (dto.periode === 'MENSUEL') {
      debut.setDate(1);
    } else if (dto.periode === 'TRIMESTRIEL') {
      debut.setMonth(debut.getMonth() - 3);
    } else if (dto.periode === 'ANNUEL') {
      debut.setMonth(0, 1);
    }

    return debut;
  }

  async getResume(userId: string, dto: FilterRapportDto) {
    const debutPeriode = this.getDebutPeriode(dto);

    const [depenses, revenus] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          utilisateurId: userId,
          type: TypeTransaction.DEPENSE,
          date: { gte: debutPeriode },
          deletedAt: null,
        },
        _sum: { montant: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          utilisateurId: userId,
          type: TypeTransaction.REVENU,
          date: { gte: debutPeriode },
          deletedAt: null,
        },
        _sum: { montant: true },
      }),
    ]);

    const totalDepenses = depenses._sum.montant ?? 0;
    const totalRevenus = revenus._sum.montant ?? 0;

    return {
      periode: dto.periode,
      totalDepenses,
      totalRevenus,
      solde: totalRevenus - totalDepenses,
    };
  }

  async getParCategorie(userId: string, dto: FilterRapportDto) {
    const debutPeriode = this.getDebutPeriode(dto);

    const depensesParCategorie = await this.prisma.transaction.groupBy({
      by: ['categorieId'],
      where: {
        utilisateurId: userId,
        type: TypeTransaction.DEPENSE,
        date: { gte: debutPeriode },
        deletedAt: null,
      },
      _sum: { montant: true },
      orderBy: { _sum: { montant: 'desc' } },
    });

    const totalGeneral = depensesParCategorie.reduce(
      (acc, item) => acc + (item._sum.montant ?? 0),
      0,
    );

    return Promise.all(
      depensesParCategorie.map(async (item) => {
        const categorie = await this.prisma.categorie.findUnique({
          where: { id: item.categorieId },
        });
        const montant = item._sum.montant ?? 0;
        return {
          categorie: categorie?.nom,
          icone: categorie?.icone,
          couleur: categorie?.couleur,
          montant,
          pourcentage:
            totalGeneral > 0 ? Math.round((montant / totalGeneral) * 100) : 0,
        };
      }),
    );
  }

  async getTendance(userId: string) {
    const resultat: { mois: string; depenses: number; revenus: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const debut = new Date();
      debut.setMonth(debut.getMonth() - i, 1);
      debut.setHours(0, 0, 0, 0);

      const fin = new Date(debut);
      fin.setMonth(fin.getMonth() + 1, 0);
      fin.setHours(23, 59, 59, 999);

      const [depenses, revenus] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            utilisateurId: userId,
            type: TypeTransaction.DEPENSE,
            date: { gte: debut, lte: fin },
            deletedAt: null,
          },
          _sum: { montant: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            utilisateurId: userId,
            type: TypeTransaction.REVENU,
            date: { gte: debut, lte: fin },
            deletedAt: null,
          },
          _sum: { montant: true },
        }),
      ]);

      resultat.push({
        mois: debut.toISOString().slice(0, 7),
        depenses: depenses._sum.montant ?? 0,
        revenus: revenus._sum.montant ?? 0,
      });
    }

    return resultat;
  }

  async exportPDF(userId: string, dto: FilterRapportDto, res: Response) {
    // 1. Récupérer les données
    const resume = await this.getResume(userId, dto);
    const categories = await this.getParCategorie(userId, dto);

    // 2. Créer le document PDF
    const doc = new PDFDocument();

    // 3. Headers HTTP pour téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=rapport.pdf');
    doc.pipe(res);

    // 4. Contenu du PDF
    doc
      .fontSize(20)
      .text('MonBudget - Rapporet Financier', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Période : ${dto.periode}`);
    doc.moveDown();
    doc.text(`Revenus    : ${resume.totalRevenus} XOF`);
    doc.text(`Dépenses   : ${resume.totalDepenses} XOF`);
    doc.text(`Solde      : ${resume.solde} XOF`);
    doc.moveDown();
    doc.fontSize(16).text('Détail par catégorie');
    doc.moveDown();
    categories.forEach((cat) => {
      doc
        .fontSize(12)
        .text(
          `${cat.icone} ${cat.categorie} : ${cat.montant} XOF (${cat.pourcentage}%)`,
        );
    });

    doc.end();
  }

  //Costruction de exel
  async exportExcel(userId: string, dto: FilterRapportDto, res: Response) {
    // 1. Récupérer les données
    const resume = await this.getResume(userId, dto);
    const categories = await this.getParCategorie(userId, dto);

    // 2. Créer le workbook Excel
    const workbook = new ExcelJS.Workbook();

    // 3. Feuille 1 - Résumé
    const sheet1 = workbook.addWorksheet('Résumé');
    sheet1.columns = [
      { header: 'Mérique', key: 'metrique', width: 20 },
      { header: 'Montant (XOF)', key: 'montant', width: 20 },
    ];
    sheet1.addRow({ metrique: 'Revenus', montant: resume.totalRevenus });
    sheet1.addRow({ metrique: 'Dépenses', montant: resume.totalDepenses });
    sheet1.addRow({ metrique: 'Solde', montant: resume.solde });

    // 4. Feuille 2 - Par catégorie
    const sheet2 = workbook.addWorksheet('Par catégorie');
    sheet2.columns = [
      { header: 'Catégorie', key: 'categorie', width: 20 },
      { header: 'Montant (XOF)', key: 'montant', width: 20 },
      { header: 'Pourcentage', key: 'pourcentage', width: 15 },
    ];
    categories.forEach((cat) => {
      sheet2.addRow({
        categorie: `${cat.icone} ${cat.categorie}`,
        montant: cat.montant,
        pourcentage: `${cat.pourcentage}%`,
      });
    });
    // 5. Headers HTTP pour téléchargement
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=rapport.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }
}
