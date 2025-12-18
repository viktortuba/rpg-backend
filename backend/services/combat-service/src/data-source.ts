import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Character } from './entities/Character';
import { Duel } from './entities/Duel';
import { DuelLog } from './entities/DuelLog';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  schema: 'combat_schema',
  synchronize: false,
  logging: true,
  entities: [Character, Duel, DuelLog],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});
