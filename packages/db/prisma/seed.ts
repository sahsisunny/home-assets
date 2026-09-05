import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed (Categories only)...');

  // Seed standard Asset Categories
  const categories = [
    { id: 'appliances', name: 'Appliances', icon: 'Refrigerator' },
    { id: 'electronics', name: 'Electronics', icon: 'Tv' },
    { id: 'furniture', name: 'Furniture', icon: 'Armchair' },
    { id: 'vehicles', name: 'Vehicles', icon: 'Car' },
    { id: 'equipment', name: 'Home Equipment', icon: 'Wrench' },
    { id: 'other', name: 'Other', icon: 'Package' },
  ];

  for (const cat of categories) {
    await prisma.assetCategory.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }
  console.log('✅ 6 standard Asset Categories seeded cleanly into PostgreSQL.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

