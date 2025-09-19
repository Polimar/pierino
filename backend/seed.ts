import { seedDatabase } from './src/utils/seeder';

async function main() {
  try {
    await seedDatabase();
    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();
