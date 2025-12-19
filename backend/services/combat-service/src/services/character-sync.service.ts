import { characterServiceClient, retryWithBackoff } from '../config/http-client';
import { CharacterSyncDto } from '../types';

/**
 * CharacterClientService - Fetches character data from Character Service API
 * No local database storage - always fetches fresh data from the source of truth
 */
export class CharacterClientService {
  async getCharacter(characterId: string, authToken?: string): Promise<CharacterSyncDto> {
    console.log(`Fetching character ${characterId} from Character Service...`);

    try {
      // Fetch character from Character Service with retry logic
      const response = await retryWithBackoff(async () => {
        const config = authToken
          ? { headers: { Authorization: `Bearer ${authToken}` } }
          : {};

        return await characterServiceClient.get(`/api/character/${characterId}`, config);
      });

      const characterData = response.data;

      console.log(`Successfully fetched character ${characterId}: ${characterData.name}`);

      // Map Character Service response to our DTO
      return {
        id: characterData.id,
        name: characterData.name,
        health: characterData.health,
        mana: characterData.mana,
        totalStrength: characterData.totalStrength,
        totalAgility: characterData.totalAgility,
        totalIntelligence: characterData.totalIntelligence,
        totalFaith: characterData.totalFaith,
        createdBy: characterData.createdBy,
      };
    } catch (error: any) {
      console.error(`Failed to fetch character ${characterId}:`, error.message);
      throw new Error(`Failed to fetch character from Character Service: ${error.message}`);
    }
  }
}
