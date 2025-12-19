import { DuelStatus, DuelTurn } from '../entities/Duel';
import { CombatAction } from '../entities/DuelLog';

// Re-export shared types
export { UserRole } from '@rpg-backend/shared';
export type { JwtPayload } from '@rpg-backend/shared';

// Character DTOs
export interface CharacterSyncDto {
  id: string;
  name: string;
  health: number;
  mana: number;
  totalStrength: number;
  totalAgility: number;
  totalIntelligence: number;
  totalFaith: number;
  createdBy: string;
}

// Duel DTOs
export interface CreateDuelDto {
  challenger1Id: string;
  challenger2Id: string;
}

export interface CharacterInDuelDto {
  id: string;
  name: string;
  currentHealth: number;
  maxHealth: number;
}

export interface DuelResponseDto {
  id: string;
  challenger1: CharacterInDuelDto;
  challenger2: CharacterInDuelDto;
  currentTurn: DuelTurn;
  status: DuelStatus;
  winnerId?: string;
  startedAt: Date;
  endedAt?: Date;
}

export interface ActionResultDto {
  action: CombatAction;
  actor: string; // character name
  target?: string; // character name (for attacks/casts)
  damage?: number;
  healing?: number;
  message: string;
  duel: DuelResponseDto;
}

// Re-export enums for convenience
export { DuelStatus, DuelTurn, CombatAction };
