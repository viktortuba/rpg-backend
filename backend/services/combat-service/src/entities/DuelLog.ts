import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Duel } from './Duel';

export enum CombatAction {
  ATTACK = 'ATTACK',
  CAST = 'CAST',
  HEAL = 'HEAL',
}

@Entity('duel_logs')
export class DuelLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Duel, (duel) => duel.logs)
  @JoinColumn({ name: 'duelId' })
  duel: Duel;

  @Column()
  duelId: string;

  @Column()
  characterId: string;

  @Column({
    type: 'enum',
    enum: CombatAction,
  })
  action: CombatAction;

  @Column({ nullable: true })
  damage: number | null;

  @Column({ nullable: true })
  healing: number | null;

  @Column()
  targetHealth: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}
