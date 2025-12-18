import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateDuelLogsTable1703000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'combat_schema.duel_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'combat_schema.uuid_generate_v4()',
          },
          {
            name: 'duelId',
            type: 'uuid',
          },
          {
            name: 'characterId',
            type: 'uuid',
          },
          {
            name: 'action',
            type: 'enum',
            enum: ['ATTACK', 'CAST', 'HEAL'],
          },
          {
            name: 'damage',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'healing',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'targetHealth',
            type: 'integer',
          },
          {
            name: 'timestamp',
            type: 'timestamp',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'combat_schema.duel_logs',
      new TableForeignKey({
        columnNames: ['duelId'],
        referencedSchema: 'combat_schema',
        referencedTableName: 'duels',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('combat_schema.duel_logs');
    if (table) {
      const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('duelId') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('combat_schema.duel_logs', foreignKey);
      }
    }
    await queryRunner.dropTable('combat_schema.duel_logs');
  }
}
