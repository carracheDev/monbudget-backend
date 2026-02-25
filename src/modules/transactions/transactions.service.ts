import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { Prisma, TypeTransaction } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * ─────────────────────────────────────────────
   * CREATE — Créer une nouvelle transaction
   * ─────────────────────────────────────────────
   * Cette méthode est le cœur du service.
   * Elle s'exécute dans une transaction Prisma ($transaction)
   * ce qui garantit que TOUTES les opérations réussissent
   * ou qu'AUCUNE n'est appliquée (atomicité).
   *
   * Étapes :
   *  1. Résoudre le compte (celui fourni ou le compte par défaut)
   *  2. Vérifier que le compte appartient bien à l'utilisateur
   *  3. Vérifier que le solde est suffisant (dépense / transfert)
   *  4. Créer l'enregistrement Transaction en base
   *  5. Mettre à jour le solde du compte
   *  6. Vérifier si un budget est dépassé (dépenses uniquement)
   */
  async create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      // ── Étape 1 : Résoudre le compte ──────────────────────────
      // Si le DTO ne fournit pas de compteId, on cherche le compte
      // marqué "estDefaut = true" pour cet utilisateur.
      // S'il n'existe pas encore, on en crée un automatiquement.
      let compteId = dto.compteId;
      if (!compteId) {
        const compteDefaut = await tx.compte.findFirst({
          where: { utilisateurId: userId, estDefaut: true, deletedAt: null },
        });
        if (!compteDefaut) {
          const nouveauCompte = await tx.compte.create({
            data: {
              nom: 'Compte principal',
              type: 'PRINCIPAL',
              estDefaut: true,
              utilisateurId: userId,
            },
          });
          compteId = nouveauCompte.id;
        } else {
          compteId = compteDefaut.id;
        }
      }

      // ── Étape 2 : Vérifier la propriété du compte ─────────────
      // On s'assure que le compte appartient bien à cet utilisateur
      // et qu'il n'est pas supprimé (soft delete via deletedAt).
      // Si ce n'est pas le cas → 404 NotFoundException.
      const compte = await tx.compte.findFirst({
        where: { id: compteId, utilisateurId: userId, deletedAt: null },
      });
      if (!compte) {
        throw new NotFoundException('Compte non trouvé');
      }

      // ── Étape 3 : Vérifier le solde disponible ────────────────
      // Pour une DEPENSE ou un TRANSFERT, le solde du compte
      // doit être supérieur ou égal au montant demandé.
      // Si insuffisant → 400 BadRequestException.
      // Les REVENUS ne nécessitent pas cette vérification.
      if (
        (dto.type === TypeTransaction.DEPENSE ||
          dto.type === TypeTransaction.TRANSFERT) &&
        compte.solde < dto.montant
      ) {
        throw new BadRequestException('Solde insuffisant');
      }

      // ── Étape 4 : Créer la transaction ────────────────────────
      // On persiste la transaction en base avec toutes ses données.
      // La date est soit celle fournie par le client, soit maintenant.
      const transaction = await tx.transaction.create({
        data: {
          montant: dto.montant,
          type: dto.type,
          description: dto.description,
          date: dto.date ? new Date(dto.date) : new Date(),
          utilisateurId: userId,
          categorieId: dto.categorieId,
          compteSourceId: compteId,
        },
      });

      // ── Étape 5 : Mettre à jour le solde du compte ────────────
      // REVENU  → on ajoute le montant au solde
      // DEPENSE / TRANSFERT → on soustrait le montant du solde
      const nouveauSolde =
        dto.type === TypeTransaction.REVENU
          ? compte.solde + dto.montant
          : compte.solde - dto.montant;

      await tx.compte.update({
        where: { id: compteId },
        data: { solde: nouveauSolde },
      });

      // ── Étape 6 : Vérifier les budgets (dépenses seulement) ───
      // On appelle verifierBudget uniquement pour les DEPENSES
      // car seules les dépenses consomment un budget.
      // Si un budget est dépassé à 85%, une notification est envoyée.
      if (dto.type === TypeTransaction.DEPENSE && dto.categorieId) {
        await this.verifierBudget(tx, userId, dto.categorieId);
      }

      return transaction;
    });
  }

  /**
   * ─────────────────────────────────────────────
   * FIND ALL — Lister les transactions
   * ─────────────────────────────────────────────
   * Retourne toutes les transactions d'un utilisateur
   * avec filtres optionnels (type, catégorie, compte).
   * Les transactions supprimées (deletedAt != null) sont exclues.
   * Résultat trié du plus récent au plus ancien.
   */
  async findAll(userId: string, filters?: FilterTransactionDto) {
    return this.prisma.transaction.findMany({
      where: {
        utilisateurId: userId,
        deletedAt: null,
        // Ces 3 filtres sont optionnels : si undefined, Prisma les ignore
        type: filters?.type,
        categorieId: filters?.categorieId,
        compteSourceId: filters?.compteId,
      },
      include: {
        categorie: true, // Jointure vers la table Categorie
        compteSource: true, // Jointure vers la table Compte
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * ─────────────────────────────────────────────
   * GET TOTAL DEPENSES MOIS — Somme des dépenses du mois en cours
   * ─────────────────────────────────────────────
   * Calcule le total de toutes les dépenses depuis le 1er du mois
   * jusqu'à maintenant, pour un utilisateur donné.
   * Utilise aggregate() de Prisma pour faire le SUM en SQL directement.
   * Retourne 0 si aucune dépense ce mois-ci (via ?? 0).
   */
  async getTotalDepensesMois(userId: string) {
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0); // Minuit pile le 1er du mois

    const result = await this.prisma.transaction.aggregate({
      where: {
        utilisateurId: userId,
        type: TypeTransaction.DEPENSE,
        date: { gte: debutMois }, // gte = greater than or equal (>=)
        deletedAt: null,
      },
      _sum: { montant: true }, // SELECT SUM(montant)
    });

    return {
      totalDepenses: result._sum.montant ?? 0,
      mois: debutMois.toISOString().slice(0, 7), // Format "2026-02"
    };
  }

  /**
   * ─────────────────────────────────────────────
   * GET TOTAL REVENUS MOIS — Somme des revenus du mois en cours
   * ─────────────────────────────────────────────
   * Même logique que getTotalDepensesMois mais pour les REVENUS.
   * Utilisé dans getResumeMois() pour calculer le solde net.
   */
  async getTotalRevenusMois(userId: string) {
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const result = await this.prisma.transaction.aggregate({
      where: {
        utilisateurId: userId,
        type: TypeTransaction.REVENU,
        date: { gte: debutMois },
        deletedAt: null,
      },
      _sum: { montant: true },
    });

    return {
      totalRevenus: result._sum.montant ?? 0,
      mois: debutMois.toISOString().slice(0, 7),
    };
  }

  /**
   * ─────────────────────────────────────────────
   * GET RESUME MOIS — Résumé financier du mois
   * ─────────────────────────────────────────────
   * Agrège dépenses et revenus du mois en un seul objet.
   * Les deux requêtes sont lancées EN PARALLÈLE via Promise.all()
   * pour optimiser les performances (pas d'attente séquentielle).
   *
   * Retourne :
   *  - mois        : "2026-02"
   *  - totalDepenses
   *  - totalRevenus
   *  - solde       : revenus - dépenses (peut être négatif)
   */
  async getResumeMois(userId: string) {
    const [depenses, revenus] = await Promise.all([
      this.getTotalDepensesMois(userId),
      this.getTotalRevenusMois(userId),
    ]);

    return {
      mois: depenses.mois,
      totalDepenses: depenses.totalDepenses,
      totalRevenus: revenus.totalRevenus,
      solde: revenus.totalRevenus - depenses.totalDepenses,
    };
  }

  /**
   * ─────────────────────────────────────────────
   * VERIFIER BUDGET — Contrôle de dépassement de budget (privée)
   * ─────────────────────────────────────────────
   * Méthode interne appelée après chaque dépense.
   * S'exécute dans la même transaction Prisma (tx) que create()
   * pour garantir la cohérence des données.
   *
   * Logique :
   *  1. Cherche un budget actif pour cette catégorie
   *  2. Si aucun budget → on sort immédiatement (return)
   *  3. Calcule le total des dépenses du mois sur cette catégorie
   *  4. Calcule le pourcentage d'utilisation du budget
   *  5. Si > 85% ET alerte pas encore envoyée → envoie notification
   *     et marque le budget comme "alerteEnvoyee = true"
   *
   * Note : le paramètre "montant" a été retiré car il n'était pas
   * utilisé dans le calcul (on agrège directement depuis la DB).
   */
  private async verifierBudget(
    tx: Prisma.TransactionClient, // Type strict Prisma (pas "any")
    userId: string,
    categorieId: string,
  ) {
    // ── Chercher le budget actif pour cette catégorie ──────────
    const budget = await tx.budget.findFirst({
      where: {
        utilisateurId: userId,
        categorieId,
        estActif: true,
        deletedAt: null,
      },
      include: { categorie: true }, // Pour récupérer categorie.nom
    });

    // Pas de budget configuré → rien à vérifier
    if (!budget) return;

    // ── Calculer le total des dépenses du mois ─────────────────
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const totalDepense = await tx.transaction.aggregate({
      where: {
        utilisateurId: userId,
        categorieId,
        type: TypeTransaction.DEPENSE,
        date: { gte: debutMois },
        deletedAt: null,
      },
      _sum: { montant: true },
    });

    const montantTotal = totalDepense._sum.montant ?? 0;

    // ── Calculer le pourcentage d'utilisation ──────────────────
    // Ex: montantTotal=85 / montantLimite=100 → pourcentage=85%
    const pourcentage = (montantTotal / budget.montantLimite) * 100;

    // ── Envoyer une notification si seuil dépassé ──────────────
    // Double condition : > 85% ET pas encore notifié (évite le spam)
    if (pourcentage > 85 && !budget.alerteEnvoyee) {
      await this.notificationsService.notifierBudgetDepasse(
        userId,
        budget.categorie.nom,
        pourcentage,
      );

      // Marquer l'alerte comme envoyée pour ne plus la renvoyer
      await tx.budget.update({
        where: { id: budget.id },
        data: { alerteEnvoyee: true },
      });
    }

    return { pourcentage, montantTotal, limite: budget.montantLimite };
  }
}
