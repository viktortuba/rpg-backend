import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Character } from './entities/Character';
import { Class } from './entities/Class';
import { Item } from './entities/Item';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: true,
  entities: [Character, Class, Item],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});
