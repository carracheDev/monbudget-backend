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

  // Calculer la date de début selon la période et les paramètres fournis
  private getDebutPeriode(dto: FilterRapportDto): Date {
    // Utiliser le mois et l'année fournis par l'utilisateur, sinon defaults
    const annee = dto.annee ?? new Date().getFullYear();
    // Mois dans le DTO est 1-based (1-12), Date.getMonth() est 0-based (0-11)
    const mois = dto.mois ? dto.mois - 1 : new Date().getMonth();
    
    const debut = new Date(annee, mois, 1);
    debut.setHours(0, 0, 0, 0);

    if (dto.periode === 'MENSUEL') {
      // Déjà au 1er du mois
    } else if (dto.periode === 'TRIMESTRIEL') {
      // Reculer de 2 mois pour avoir le début du trimestre
      debut.setMonth(debut.getMonth() - 2);
    } else if (dto.periode === 'ANNUEL') {
      debut.setMonth(0, 1); // 1er janvier
    }

    return debut;
  }

  // Calculer la date de fin selon la période
  private getFinPeriode(dto: FilterRapportDto): Date {
    const annee = dto.annee ?? new Date().getFullYear();
    const mois = dto.mois ? dto.mois - 1 : new Date().getMonth();
    
    const fin = new Date(annee, mois + 1, 0); // Dernier jour du mois
    fin.setHours(23, 59, 59, 999);

    if (dto.periode === 'MENSUEL') {
      // Fin du mois
    } else if (dto.periode === 'TRIMESTRIEL') {
      fin.setMonth(fin.getMonth() + 2); // Fin du trimestre
    } else if (dto.periode === 'ANNUEL') {
      fin.setMonth(11, 31); // 31 décembre
    }

    return fin;
  }

  async getResume(userId: string, dto: FilterRapportDto) {
    const debutPeriode = this.getDebutPeriode(dto);
    const finPeriode = this.getFinPeriode(dto);

    const [depenses, revenus] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          utilisateurId: userId,
          type: TypeTransaction.DEPENSE,
          date: { gte: debutPeriode, lte: finPeriode },
          deletedAt: null,
        },
        _sum: { montant: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          utilisateurId: userId,
          type: TypeTransaction.REVENU,
          date: { gte: debutPeriode, lte: finPeriode },
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
    const finPeriode = this.getFinPeriode(dto);

    const depensesParCategorie = await this.prisma.transaction.groupBy({
      by: ['categorieId'],
      where: {
        utilisateurId: userId,
        type: TypeTransaction.DEPENSE,
        date: { gte: debutPeriode, lte: finPeriode },
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
    const doc = new PDFDocument({ margin: 50 });

    // 3. Headers HTTP pour téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=rapport.pdf');
    doc.pipe(res);

    // Couleurs de l'app
    const primary = '#E53935'; // Rouge
    const success = '#2E7D32'; // Vert revenus
    const warning = '#F57C00'; // Orange dépenses
    const savings = '#1565C0'; // Bleu solde
    const textDark = '#212121';
    const textLight = '#757575';
    const white = '#FFFFFF';
    const lightGray = '#F5F5F5';

    // ============ PAGE 1 - En-tête coloré ============
    // Fond d'en-tête rouge
    doc.rect(0, 0, doc.page.width, 100).fill(primary);
    
    // Titre en blanc
    doc
      .fillColor(white)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('MonBudget', 50, 35, { align: 'center' });
    doc
      .fontSize(14)
      .font('Helvetica')
      .text('Rapport Financier', { align: 'center' });
    
    // Réinitialiser la couleur
    doc.fillColor(textDark);

    // ============ Informations période ============
    doc.moveDown(3);
    doc.fontSize(12).text(`Période : ${dto.periode}`, 50);
    doc.fontSize(10).fillColor(textLight).text(
      `Généré le : ${new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`,
    );
    doc.fillColor(textDark);
    doc.moveDown(2);

    // ============ Section Résumé ============
    // Titre de section avec fond
    doc.rect(50, doc.y, doc.page.width - 100, 25).fill(lightGray);
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(primary)
      .text('📊 Résumé Financier', 60, doc.y - 20);
    doc.moveDown(2);
    doc.fillColor(textDark);

    // Tableau des chiffres clés
    const startY = doc.y;
    const colWidth = (doc.page.width - 100) / 3;

    // Revenus - Vert
    doc.rect(50, startY, colWidth - 10, 60).fill(success).fillColor(white);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('REVENUS', 55, startY + 10, { width: colWidth - 20, align: 'center' });
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(
        `${resume.totalRevenus.toLocaleString('fr-FR')} XOF`,
        55,
        startY + 30,
        { width: colWidth - 20, align: 'center' },
      );

    // Dépenses - Orange
    doc
      .rect(50 + colWidth, startY, colWidth - 10, 60)
      .fill(warning)
      .fillColor(white);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('DÉPENSES', 55 + colWidth, startY + 10, { width: colWidth - 20, align: 'center' });
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(
        `${resume.totalDepenses.toLocaleString('fr-FR')} XOF`,
        55 + colWidth,
        startY + 30,
        { width: colWidth - 20, align: 'center' },
      );

    // Solde - Bleu
    doc
      .rect(50 + colWidth * 2, startY, colWidth - 10, 60)
      .fill(savings)
      .fillColor(white);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('SOLDE', 55 + colWidth * 2, startY + 10, { width: colWidth - 20, align: 'center' });
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(
        `${resume.solde.toLocaleString('fr-FR')} XOF`,
        55 + colWidth * 2,
        startY + 30,
        { width: colWidth - 20, align: 'center' },
      );

    doc.fillColor(textDark).moveDown(5);

    // ============ Section Catégories ============
    // Titre de section
    doc.rect(50, doc.y, doc.page.width - 100, 25).fill(lightGray);
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(primary)
      .text('📁 Dépenses par Catégorie', 60, doc.y - 20);
    doc.moveDown(2);
    doc.fillColor(textDark);

    // Liste des catégories avec leurs couleurs
    if (categories.length === 0) {
      doc.fontSize(10).fillColor(textLight).text('Aucune dépense enregistrée pour cette période.');
    } else {
      categories.forEach((cat, index) => {
        const y = doc.y;
        const lineHeight = 25;
        
        // Ligne de fond alternée
        if (index % 2 === 0) {
          doc.rect(50, y, doc.page.width - 100, lineHeight).fill(lightGray);
        }
        
        // Indicateur de couleur de la catégorie
        const catColor = cat.couleur || primary;
        doc.circle(65, y + lineHeight / 2, 5).fill(catColor);
        
        // Nom de la catégorie avec icône
        doc
          .fillColor(textDark)
          .fontSize(11)
          .font('Helvetica')
          .text(`${cat.icone || '📁'} ${cat.categorie || 'Sans catégorie'}`, 80, y + 7);
        
        // Pourcentage
        doc
          .fillColor(textLight)
          .fontSize(10)
          .text(`${cat.pourcentage}%`, doc.page.width - 120, y + 7);
        
        // Montant aligné à droite
        doc
          .fillColor(textDark)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(
            `${cat.montant.toLocaleString('fr-FR')} XOF`,
            doc.page.width - 100,
            y + 7,
            { width: 90, align: 'right' },
          );
        
        doc.moveDown();
      });
    }

    // ============ Pied de page ============
    doc.moveDown(3);
    doc
      .fillColor(textLight)
      .fontSize(8)
      .text(
        'Rapport généré par MonBudget - Application de gestion de finances personnelles',
        50,
        doc.page.height - 50,
        { align: 'center' },
      );

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
