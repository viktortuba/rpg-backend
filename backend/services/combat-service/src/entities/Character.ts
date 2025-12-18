import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Duel } from './Duel';

@Entity('characters')
export class Character {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  health: number;

  @Column()
  mana: number;

  @Column()
  strength: number;

  @Column()
  agility: number;

  @Column()
  intelligence: number;

  @Column()
  faith: number;

  @Column()
  createdBy: string; // User ID from Account Service

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships (as challenger1 or challenger2)
  @OneToMany(() => Duel, (duel) => duel.challenger1)
  duelsAsChallenger1: Duel[];

  @OneToMany(() => Duel, (duel) => duel.challenger2)
  duelsAsChallenger2: Duel[];
}
