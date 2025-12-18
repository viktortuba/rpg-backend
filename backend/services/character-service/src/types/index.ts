// Re-export shared types
export { UserRole, JwtPayload } from '@rpg-backend/shared';

// Character DTOs
export interface CreateCharacterDto {
  name: string;
  health: number;
  mana: number;
  baseStrength: number;
  baseAgility: number;
  baseIntelligence: number;
  baseFaith: number;
  classId: string;
}

export interface CharacterListDto {
  id: string;
  name: string;
  health: number;
  mana: number;
}

export interface CharacterDetailDto {
  id: string;
  name: string;
  health: number;
  mana: number;
  baseStrength: number;
  baseAgility: number;
  baseIntelligence: number;
  baseFaith: number;
  totalStrength: number;
  totalAgility: number;
  totalIntelligence: number;
  totalFaith: number;
  class: {
    id: string;
    name: string;
    description: string;
  };
  items: Array<{
    id: string;
    name: string;
    displayName: string;
    description: string;
    bonusStrength: number;
    bonusAgility: number;
    bonusIntelligence: number;
    bonusFaith: number;
  }>;
  createdBy: string;
  createdAt: Date;
}

// Item DTOs
export interface CreateItemDto {
  name: string;
  description: string;
  bonusStrength: number;
  bonusAgility: number;
  bonusIntelligence: number;
  bonusFaith: number;
}

export interface ItemDto {
  id: string;
  name: string;
  displayName: string;
  description: string;
  bonusStrength: number;
  bonusAgility: number;
  bonusIntelligence: number;
  bonusFaith: number;
  characterId: string | null;
}

export interface GrantItemDto {
  itemId: string;
  characterId: string;
}

export interface GiftItemDto {
  itemId: string;
  fromCharacterId: string;
  toCharacterId: string;
}
