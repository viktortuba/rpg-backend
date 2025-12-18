import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCharactersTable1703000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'characters',
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
            isUnique: true,
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
            name: 'baseStrength',
            type: 'integer',
          },
          {
            name: 'baseAgility',
            type: 'integer',
          },
          {
            name: 'baseIntelligence',
            type: 'integer',
          },
          {
            name: 'baseFaith',
            type: 'integer',
          },
          {
            name: 'classId',
            type: 'uuid',
          },
          {
            name: 'createdBy',
            type: 'varchar',
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
      'characters',
      new TableForeignKey({
        columnNames: ['classId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'classes',
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('characters');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('classId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('characters', foreignKey);
    }
    await queryRunner.dropTable('characters');
  }
}
