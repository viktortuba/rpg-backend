import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { AppDataSource } from './data-source';

async function start() {
  try {
    // Initialize TypeORM
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Run migrations
    await AppDataSource.runMigrations();
    console.log('Migrations completed');

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Account Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
}

start();
