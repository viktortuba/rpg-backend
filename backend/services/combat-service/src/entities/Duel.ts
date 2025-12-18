import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Character } from './Character';
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

  @ManyToOne(() => Character, (character) => character.duelsAsChallenger1)
  @JoinColumn({ name: 'challenger1Id' })
  challenger1: Character;

  @Column()
  challenger1Id: string;

  @ManyToOne(() => Character, (character) => character.duelsAsChallenger2)
  @JoinColumn({ name: 'challenger2Id' })
  challenger2: Character;

  @Column()
  challenger2Id: string;

  @Column({
    type: 'enum',
    enum: DuelTurn,
    default: DuelTurn.CHALLENGER_1,
  })
  currentTurn: DuelTurn;

  @Column()
  challenger1Health: number;

  @Column()
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

  @Column({ nullable: true })
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
