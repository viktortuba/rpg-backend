import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DuelLog } from './DuelLog';

export enum DuelStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DRAW = 'DRAW',
}

export enum DuelTurn {
  CHALLENGER_1 = 'CHALLENGER_1',
  CHALLENGER_2 = 'CHALLENGER_2',
}

@Entity('duels')
export class Duel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  challenger1Id: string;

  @Column()
  challenger2Id: string;

  // Character snapshot data (cached at duel creation)
  @Column({ type: 'varchar' })
  challenger1Name: string;

  @Column({ type: 'varchar' })
  challenger2Name: string;

  @Column({ type: 'varchar' })
  challenger1CreatedBy: string;

  @Column({ type: 'varchar' })
  challenger2CreatedBy: string;

  @Column({ type: 'integer' })
  challenger1MaxHealth: number;

  @Column({ type: 'integer' })
  challenger2MaxHealth: number;

  @Column({ type: 'integer' })
  challenger1TotalStrength: number;

  @Column({ type: 'integer' })
  challenger2TotalStrength: number;

  @Column({ type: 'integer' })
  challenger1TotalAgility: number;

  @Column({ type: 'integer' })
  challenger2TotalAgility: number;

  @Column({ type: 'integer' })
  challenger1TotalIntelligence: number;

  @Column({ type: 'integer' })
  challenger2TotalIntelligence: number;

  @Column({ type: 'integer' })
  challenger1TotalFaith: number;

  @Column({ type: 'integer' })
  challenger2TotalFaith: number;

  @Column({
    type: 'enum',
    enum: DuelTurn,
    default: DuelTurn.CHALLENGER_1,
  })
  currentTurn: DuelTurn;

  @Column({ type: 'integer' })
  challenger1Health: number;

  @Column({ type: 'integer' })
  challenger2Health: number;

  @Column({ type: 'timestamp', nullable: true })
  challenger1LastAction: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  challenger2LastAction: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  challenger1LastCast: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  challenger2LastCast: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  challenger1LastHeal: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  challenger2LastHeal: Date | null;

  @Column({
    type: 'enum',
    enum: DuelStatus,
    default: DuelStatus.ACTIVE,
  })
  status: DuelStatus;

  @Column({ type: 'varchar', nullable: true })
  winnerId: string | null;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @OneToMany(() => DuelLog, (log) => log.duel)
  logs: DuelLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
