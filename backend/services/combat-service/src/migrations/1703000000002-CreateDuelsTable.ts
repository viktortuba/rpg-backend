import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateDuelsTable1703000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'combat_schema.duels',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'combat_schema.uuid_generate_v4()',
          },
          {
            name: 'challenger1Id',
            type: 'uuid',
          },
          {
            name: 'challenger2Id',
            type: 'uuid',
          },
          {
            name: 'currentTurn',
            type: 'enum',
            enum: ['CHALLENGER_1', 'CHALLENGER_2'],
            default: "'CHALLENGER_1'",
          },
          {
            name: 'challenger1Health',
            type: 'integer',
          },
          {
            name: 'challenger2Health',
            type: 'integer',
          },
          {
            name: 'challenger1LastAction',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'challenger2LastAction',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'challenger1LastCast',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'challenger2LastCast',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'challenger1LastHeal',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'challenger2LastHeal',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'COMPLETED', 'DRAW'],
            default: "'ACTIVE'",
          },
          {
            name: 'winnerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'startedAt',
            type: 'timestamp',
          },
          {
            name: 'endedAt',
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

    // Add foreign keys
    await queryRunner.createForeignKey(
      'combat_schema.duels',
      new TableForeignKey({
        columnNames: ['challenger1Id'],
        referencedSchema: 'combat_schema',
        referencedTableName: 'characters',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'combat_schema.duels',
      new TableForeignKey({
        columnNames: ['challenger2Id'],
        referencedSchema: 'combat_schema',
        referencedTableName: 'characters',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('combat_schema.duels');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('combat_schema.duels', fk);
      }
    }
    await queryRunner.dropTable('combat_schema.duels');
  }
}
