import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Class } from './Class';
import { Item } from './Item';

@Entity('characters')
export class Character {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  health: number;

  @Column()
  mana: number;

  @Column()
  baseStrength: number;

  @Column()
  baseAgility: number;

  @Column()
  baseIntelligence: number;

  @Column()
  baseFaith: number;

  @ManyToOne(() => Class, (classEntity) => classEntity.characters)
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column()
  classId: string;

  @OneToMany(() => Item, (item) => item.character)
  items: Item[];

  @Column()
  createdBy: string; // User ID from Account Service

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Calculate total stats including item bonuses
  calculateTotalStats(): {
    totalStrength: number;
    totalAgility: number;
    totalIntelligence: number;
    totalFaith: number;
  } {
    const bonuses = {
      totalStrength: this.baseStrength,
      totalAgility: this.baseAgility,
      totalIntelligence: this.baseIntelligence,
      totalFaith: this.baseFaith,
    };

    if (this.items) {
      this.items.forEach((item) => {
        bonuses.totalStrength += item.bonusStrength;
        bonuses.totalAgility += item.bonusAgility;
        bonuses.totalIntelligence += item.bonusIntelligence;
        bonuses.totalFaith += item.bonusFaith;
      });
    }

    return bonuses;
  }
}
