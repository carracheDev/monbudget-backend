import { PrismaClient, TypeCategorie } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding catégories par défaut...');

  const categories = [
    // DEPENSES
    {
      nom: 'Alimentation',
      icone: '🍔',
      couleur: '#FF5733',
      type: TypeCategorie.DEPENSE,
    },
    {
      nom: 'Transport',
      icone: '🚗',
      couleur: '#3498DB',
      type: TypeCategorie.DEPENSE,
    },
    {
      nom: 'Santé',
      icone: '💊',
      couleur: '#2ECC71',
      type: TypeCategorie.DEPENSE,
    },
    {
      nom: 'Logement',
      icone: '🏠',
      couleur: '#9B59B6',
      type: TypeCategorie.DEPENSE,
    },
    {
      nom: 'Loisirs',
      icone: '🎮',
      couleur: '#F39C12',
      type: TypeCategorie.DEPENSE,
    },
    {
      nom: 'Shopping',
      icone: '🛍️',
      couleur: '#E91E63',
      type: TypeCategorie.DEPENSE,
    },
    {
      nom: 'Éducation',
      icone: '📚',
      couleur: '#1ABC9C',
      type: TypeCategorie.DEPENSE,
    },
    {
      nom: 'Factures',
      icone: '💡',
      couleur: '#E74C3C',
      type: TypeCategorie.DEPENSE,
    },
    {
      nom: 'Autre dépense',
      icone: '📦',
      couleur: '#95A5A6',
      type: TypeCategorie.DEPENSE,
    },
    // REVENUS
    {
      nom: 'Salaire',
      icone: '💰',
      couleur: '#27AE60',
      type: TypeCategorie.REVENU,
    },
    {
      nom: 'Freelance',
      icone: '💻',
      couleur: '#2980B9',
      type: TypeCategorie.REVENU,
    },
    {
      nom: 'Investissement',
      icone: '📈',
      couleur: '#8E44AD',
      type: TypeCategorie.REVENU,
    },
    {
      nom: 'Cadeau reçu',
      icone: '🎁',
      couleur: '#F1C40F',
      type: TypeCategorie.REVENU,
    },
    {
      nom: 'Autre revenu',
      icone: '💵',
      couleur: '#16A085',
      type: TypeCategorie.REVENU,
    },
    // TRANSFERTS
    {
      nom: 'Transfert',
      icone: '🔄',
      couleur: '#7F8C8D',
      type: TypeCategorie.TRANSFERT,
    },
    {
      nom: 'Épargne',
      icone: '🐷',
      couleur: '#2C3E50',
      type: TypeCategorie.TRANSFERT,
    },
  ];

  for (const cat of categories) {
    // Vérifier si elle existe déjà avant de créer
    const existante = await prisma.categorie.findFirst({
      where: { nom: cat.nom, estDefaut: true },
    });

    if (!existante) {
      await prisma.categorie.create({
        data: {
          nom: cat.nom,
          icone: cat.icone,
          couleur: cat.couleur,
          type: cat.type,
          estDefaut: true,
          utilisateurId: null,
        },
      });
      console.log(`✅ Créée : ${cat.icone} ${cat.nom}`);
    } else {
      console.log(`⏭️  Déjà existante : ${cat.nom}`);
    }
  }

  console.log('\n🎉 Seed terminé !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
