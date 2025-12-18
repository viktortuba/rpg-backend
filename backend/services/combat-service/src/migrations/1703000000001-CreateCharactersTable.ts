import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCharactersTable1703000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'combat_schema.characters',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'health',
            type: 'integer',
          },
          {
            name: 'mana',
            type: 'integer',
          },
          {
            name: 'strength',
            type: 'integer',
          },
          {
            name: 'agility',
            type: 'integer',
          },
          {
            name: 'intelligence',
            type: 'integer',
          },
          {
            name: 'faith',
            type: 'integer',
          },
          {
            name: 'createdBy',
            type: 'varchar',
          },
          {
            name: 'lastSyncedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('combat_schema.characters');
  }
}
