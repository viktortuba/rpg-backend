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

    // Create schema if it doesn't exist
    await AppDataSource.query('CREATE SCHEMA IF NOT EXISTS combat_schema');
    console.log('Schema ensured');

    // Create uuid-ossp extension if it doesn't exist (it's global, available to all schemas)
    await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('UUID extension ensured');

    // Run migrations
    await AppDataSource.runMigrations();
    console.log('Migrations completed');

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Combat Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
}

start();
