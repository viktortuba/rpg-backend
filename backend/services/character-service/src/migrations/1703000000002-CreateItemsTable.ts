import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateItemsTable1703000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'bonusStrength',
            type: 'integer',
            default: 0,
          },
          {
            name: 'bonusAgility',
            type: 'integer',
            default: 0,
          },
          {
            name: 'bonusIntelligence',
            type: 'integer',
            default: 0,
          },
          {
            name: 'bonusFaith',
            type: 'integer',
            default: 0,
          },
          {
            name: 'characterId',
            type: 'uuid',
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

    await queryRunner.createForeignKey(
      'items',
      new TableForeignKey({
        columnNames: ['characterId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'characters',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('items');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('characterId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('items', foreignKey);
    }
    await queryRunner.dropTable('items');
  }
}
