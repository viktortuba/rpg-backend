import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCharacterSnapshotToDuels1703000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add character snapshot columns to duels table
    await queryRunner.addColumns('combat_schema.duels', [
      new TableColumn({
        name: 'challenger1Name',
        type: 'varchar',
        isNullable: true, // Allow null for existing rows
      }),
      new TableColumn({
        name: 'challenger2Name',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'challenger1CreatedBy',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'challenger2CreatedBy',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'challenger1MaxHealth',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'challenger2MaxHealth',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'challenger1TotalStrength',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'challenger2TotalStrength',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'challenger1TotalAgility',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'challenger2TotalAgility',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'challenger1TotalIntelligence',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'challenger2TotalIntelligence',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'challenger1TotalFaith',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'challenger2TotalFaith',
        type: 'integer',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove character snapshot columns
    await queryRunner.dropColumns('combat_schema.duels', [
      'challenger1Name',
      'challenger2Name',
      'challenger1CreatedBy',
      'challenger2CreatedBy',
      'challenger1MaxHealth',
      'challenger2MaxHealth',
      'challenger1TotalStrength',
      'challenger2TotalStrength',
      'challenger1TotalAgility',
      'challenger2TotalAgility',
      'challenger1TotalIntelligence',
      'challenger2TotalIntelligence',
      'challenger1TotalFaith',
      'challenger2TotalFaith',
    ]);
  }
}
