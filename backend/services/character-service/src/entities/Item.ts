import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Character } from './Character';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 0 })
  bonusStrength: number;

  @Column({ default: 0 })
  bonusAgility: number;

  @Column({ default: 0 })
  bonusIntelligence: number;

  @Column({ default: 0 })
  bonusFaith: number;

  @ManyToOne(() => Character, (character) => character.items, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'characterId' })
  character: Character | null;

  @Column({ nullable: true })
  characterId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual property to get the item name with suffix based on highest bonus
  getDisplayName(): string {
    const bonuses = {
      Strength: this.bonusStrength,
      Agility: this.bonusAgility,
      Intelligence: this.bonusIntelligence,
      Faith: this.bonusFaith,
    };

    const maxBonus = Math.max(...Object.values(bonuses));

    if (maxBonus === 0) {
      return this.name;
    }

    const maxStat = Object.entries(bonuses).find(([_, value]) => value === maxBonus)?.[0];

    const suffixes: Record<string, string> = {
      Strength: 'of Strength',
      Agility: 'of Agility',
      Intelligence: 'of Intelligence',
      Faith: 'of Faith',
    };

    return `${this.name} ${suffixes[maxStat!]}`;
  }
}
