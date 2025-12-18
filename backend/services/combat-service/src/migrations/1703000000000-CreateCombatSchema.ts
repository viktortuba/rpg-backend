import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCombatSchema1703000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the combat_schema
    await queryRunner.query('CREATE SCHEMA IF NOT EXISTS combat_schema');

    // Enable UUID extension in the combat schema
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA combat_schema');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP SCHEMA IF EXISTS combat_schema CASCADE');
  }
}
