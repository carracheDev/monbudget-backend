-- CreateEnum
CREATE TYPE "TypeCompte" AS ENUM ('PRINCIPAL', 'EPARGNE', 'MOBILE_MONEY', 'BANQUE', 'CASH', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeCategorie" AS ENUM ('DEPENSE', 'REVENU', 'TRANSFERT');

-- CreateEnum
CREATE TYPE "TypeTransaction" AS ENUM ('DEPENSE', 'REVENU', 'TRANSFERT');

-- CreateEnum
CREATE TYPE "StatutTransaction" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'ANNULEE', 'REMBOURSEE');

-- CreateEnum
CREATE TYPE "StatutOperation" AS ENUM ('EN_COURS', 'VALIDEE', 'ECHOUEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "PeriodeBudget" AS ENUM ('HEBDOMADAIRE', 'MENSUEL', 'TRIMESTRIEL', 'ANNUEL');

-- CreateEnum
CREATE TYPE "StatutObjectif" AS ENUM ('ACTIF', 'TERMINE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('BUDGET', 'TRANSACTION', 'OBJECTIF', 'SYSTEME', 'SECURITE', 'MARKETING');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Langue" AS ENUM ('FR', 'EN', 'PT');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "nomComplet" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "telephone" TEXT,
    "avatarUrl" TEXT,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "emailVerifie" BOOLEAN NOT NULL DEFAULT false,
    "telephoneVerifie" BOOLEAN NOT NULL DEFAULT false,
    "derniereConnexion" TIMESTAMP(3),
    "tentativeConnexion" INTEGER NOT NULL DEFAULT 0,
    "bloqueJusqua" TIMESTAMP(3),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comptes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeCompte" NOT NULL DEFAULT 'PRINCIPAL',
    "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "soldeInitial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "estDefaut" BOOLEAN NOT NULL DEFAULT false,
    "operateur" TEXT,
    "numeroTelephone" TEXT,
    "referenceExterne" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "utilisateurId" TEXT NOT NULL,

    CONSTRAINT "comptes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "couleur" TEXT NOT NULL,
    "type" "TypeCategorie" NOT NULL DEFAULT 'DEPENSE',
    "estDefaut" BOOLEAN NOT NULL DEFAULT false,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "utilisateurId" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "type" "TypeTransaction" NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutTransaction" NOT NULL DEFAULT 'VALIDEE',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "adresse" TEXT,
    "pieceJointeUrl" TEXT,
    "idempotencyKey" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "utilisateurId" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "compteSourceId" TEXT,
    "compteDestId" TEXT,
    "budgetId" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soldes_historique" (
    "id" TEXT NOT NULL,
    "soldeAvant" DOUBLE PRECISION NOT NULL,
    "soldeApres" DOUBLE PRECISION NOT NULL,
    "difference" DOUBLE PRECISION NOT NULL,
    "raison" TEXT NOT NULL,
    "referenceId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compteId" TEXT NOT NULL,

    CONSTRAINT "soldes_historique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "montantLimite" DOUBLE PRECISION NOT NULL,
    "periode" "PeriodeBudget" NOT NULL DEFAULT 'MENSUEL',
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),
    "alerteSeuil" INTEGER NOT NULL DEFAULT 85,
    "alerteEnvoyee" BOOLEAN NOT NULL DEFAULT false,
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "utilisateurId" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objectifs_epargne" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "description" TEXT,
    "montantCible" DOUBLE PRECISION NOT NULL,
    "montantActuel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "statut" "StatutObjectif" NOT NULL DEFAULT 'ACTIF',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "utilisateurId" TEXT NOT NULL,

    CONSTRAINT "objectifs_epargne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "objectifId" TEXT NOT NULL,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portefeuilles" (
    "id" TEXT NOT NULL,
    "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "soldeBloque" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "numeroPrincipal" TEXT,
    "operateurDefaut" TEXT,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "utilisateurId" TEXT NOT NULL,

    CONSTRAINT "portefeuilles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recharges" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "operateur" TEXT NOT NULL,
    "numeroTelephone" TEXT NOT NULL,
    "referenceOperateur" TEXT,
    "statut" "StatutOperation" NOT NULL DEFAULT 'EN_COURS',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidation" TIMESTAMP(3),
    "utilisateurId" TEXT NOT NULL,

    CONSTRAINT "recharges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "operateur" TEXT NOT NULL,
    "numeroDestinataire" TEXT NOT NULL,
    "description" TEXT,
    "referenceOperateur" TEXT,
    "statut" "StatutOperation" NOT NULL DEFAULT 'EN_COURS',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidation" TIMESTAMP(3),
    "utilisateurId" TEXT NOT NULL,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "estLu" BOOLEAN NOT NULL DEFAULT false,
    "type" "TypeNotification" NOT NULL,
    "donnees" JSONB,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateLecture" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "utilisateurId" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "tokenFcm" TEXT NOT NULL,
    "plateforme" TEXT NOT NULL,
    "modele" TEXT,
    "appVersion" TEXT,
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "derniereUtilisation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilisateurId" TEXT NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAdresse" TEXT,
    "userAgent" TEXT,
    "estValide" BOOLEAN NOT NULL DEFAULT true,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateExpiration" TIMESTAMP(3) NOT NULL,
    "dateRevocation" TIMESTAMP(3),
    "utilisateurId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametres" (
    "id" TEXT NOT NULL,
    "theme" "Theme" NOT NULL DEFAULT 'LIGHT',
    "langue" "Langue" NOT NULL DEFAULT 'FR',
    "biometrie" BOOLEAN NOT NULL DEFAULT false,
    "notificationsPush" BOOLEAN NOT NULL DEFAULT true,
    "notificationsEmail" BOOLEAN NOT NULL DEFAULT true,
    "pinCode" TEXT,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "utilisateurId" TEXT NOT NULL,

    CONSTRAINT "parametres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_firebaseUid_key" ON "utilisateurs"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_firebaseUid_idx" ON "utilisateurs"("firebaseUid");

-- CreateIndex
CREATE INDEX "utilisateurs_email_idx" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_deleted_at_idx" ON "utilisateurs"("deleted_at");

-- CreateIndex
CREATE INDEX "comptes_utilisateurId_idx" ON "comptes"("utilisateurId");

-- CreateIndex
CREATE INDEX "comptes_deleted_at_idx" ON "comptes"("deleted_at");

-- CreateIndex
CREATE INDEX "categories_utilisateurId_idx" ON "categories"("utilisateurId");

-- CreateIndex
CREATE INDEX "categories_type_idx" ON "categories"("type");

-- CreateIndex
CREATE INDEX "categories_deleted_at_idx" ON "categories"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nom_utilisateurId_key" ON "categories"("nom", "utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "transactions_utilisateurId_idx" ON "transactions"("utilisateurId");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- CreateIndex
CREATE INDEX "transactions_categorieId_idx" ON "transactions"("categorieId");

-- CreateIndex
CREATE INDEX "transactions_compteSourceId_idx" ON "transactions"("compteSourceId");

-- CreateIndex
CREATE INDEX "transactions_idempotencyKey_idx" ON "transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "transactions_deleted_at_idx" ON "transactions"("deleted_at");

-- CreateIndex
CREATE INDEX "soldes_historique_compteId_idx" ON "soldes_historique"("compteId");

-- CreateIndex
CREATE INDEX "soldes_historique_date_idx" ON "soldes_historique"("date");

-- CreateIndex
CREATE INDEX "budgets_utilisateurId_idx" ON "budgets"("utilisateurId");

-- CreateIndex
CREATE INDEX "budgets_categorieId_idx" ON "budgets"("categorieId");

-- CreateIndex
CREATE INDEX "budgets_deleted_at_idx" ON "budgets"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_utilisateurId_categorieId_periode_dateDebut_key" ON "budgets"("utilisateurId", "categorieId", "periode", "dateDebut");

-- CreateIndex
CREATE INDEX "objectifs_epargne_utilisateurId_idx" ON "objectifs_epargne"("utilisateurId");

-- CreateIndex
CREATE INDEX "objectifs_epargne_statut_idx" ON "objectifs_epargne"("statut");

-- CreateIndex
CREATE INDEX "objectifs_epargne_deleted_at_idx" ON "objectifs_epargne"("deleted_at");

-- CreateIndex
CREATE INDEX "contributions_objectifId_idx" ON "contributions"("objectifId");

-- CreateIndex
CREATE INDEX "contributions_date_idx" ON "contributions"("date");

-- CreateIndex
CREATE UNIQUE INDEX "portefeuilles_utilisateurId_key" ON "portefeuilles"("utilisateurId");

-- CreateIndex
CREATE INDEX "recharges_utilisateurId_idx" ON "recharges"("utilisateurId");

-- CreateIndex
CREATE INDEX "recharges_statut_idx" ON "recharges"("statut");

-- CreateIndex
CREATE INDEX "paiements_utilisateurId_idx" ON "paiements"("utilisateurId");

-- CreateIndex
CREATE INDEX "paiements_statut_idx" ON "paiements"("statut");

-- CreateIndex
CREATE INDEX "notifications_utilisateurId_idx" ON "notifications"("utilisateurId");

-- CreateIndex
CREATE INDEX "notifications_estLu_idx" ON "notifications"("estLu");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_deleted_at_idx" ON "notifications"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "devices_tokenFcm_key" ON "devices"("tokenFcm");

-- CreateIndex
CREATE INDEX "devices_utilisateurId_idx" ON "devices"("utilisateurId");

-- CreateIndex
CREATE INDEX "devices_tokenFcm_idx" ON "devices"("tokenFcm");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_utilisateurId_idx" ON "sessions"("utilisateurId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_estValide_idx" ON "sessions"("estValide");

-- CreateIndex
CREATE UNIQUE INDEX "parametres_utilisateurId_key" ON "parametres"("utilisateurId");

-- AddForeignKey
ALTER TABLE "comptes" ADD CONSTRAINT "comptes_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_compteSourceId_fkey" FOREIGN KEY ("compteSourceId") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_compteDestId_fkey" FOREIGN KEY ("compteDestId") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soldes_historique" ADD CONSTRAINT "soldes_historique_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectifs_epargne" ADD CONSTRAINT "objectifs_epargne_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_objectifId_fkey" FOREIGN KEY ("objectifId") REFERENCES "objectifs_epargne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portefeuilles" ADD CONSTRAINT "portefeuilles_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recharges" ADD CONSTRAINT "recharges_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametres" ADD CONSTRAINT "parametres_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
