import { NestFactory } from '@nestjs/core';

import { SuperAdminSeeder } from './admin.seed';
import { SeederModule } from './seeder.module';

async function seed() {
  const app = await NestFactory.createApplicationContext(SeederModule);

  const superAdminSeeder = app.get(SuperAdminSeeder);

  try {
    await superAdminSeeder.seed();
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await app.close();
  }
}

seed();
