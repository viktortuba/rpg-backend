import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialData1703000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed Classes
    await queryRunner.query(`
      INSERT INTO classes (id, name, description, "createdAt", "updatedAt") VALUES
        (uuid_generate_v4(), 'Warrior', 'A strong melee fighter with high health and strength', now(), now()),
        (uuid_generate_v4(), 'Rogue', 'A quick and agile character specialized in critical strikes', now(), now()),
        (uuid_generate_v4(), 'Mage', 'A powerful spellcaster with high intelligence and mana', now(), now()),
        (uuid_generate_v4(), 'Cleric', 'A holy warrior with healing abilities and strong faith', now(), now())
      ON CONFLICT (name) DO NOTHING;
    `);

    // Seed some initial items
    await queryRunner.query(`
      INSERT INTO items (id, name, description, "bonusStrength", "bonusAgility", "bonusIntelligence", "bonusFaith", "createdAt", "updatedAt") VALUES
        (uuid_generate_v4(), 'Iron Sword', 'A sturdy iron blade', 10, 0, 0, 0, now(), now()),
        (uuid_generate_v4(), 'Leather Armor', 'Light protective armor', 2, 5, 0, 0, now(), now()),
        (uuid_generate_v4(), 'Wizard Staff', 'A magical staff crackling with energy', 0, 0, 15, 0, now(), now()),
        (uuid_generate_v4(), 'Holy Symbol', 'A blessed religious icon', 0, 0, 0, 12, now(), now()),
        (uuid_generate_v4(), 'Magic Ring', 'A ring imbued with arcane power', 0, 3, 8, 0, now(), now())
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM items WHERE "characterId" IS NULL;`);
    await queryRunner.query(`DELETE FROM classes WHERE name IN ('Warrior', 'Rogue', 'Mage', 'Cleric');`);
  }
}
