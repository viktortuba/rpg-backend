import { AppDataSource } from '../data-source';
import { Character } from '../entities/Character';
import { characterServiceClient, retryWithBackoff } from '../config/http-client';

export class CharacterSyncService {
  private characterRepository = AppDataSource.getRepository(Character);

  async syncCharacter(characterId: string, authToken?: string): Promise<Character> {
    console.log(`Syncing character ${characterId} from Character Service...`);

    try {
      // Fetch character from Character Service with retry logic
      const response = await retryWithBackoff(async () => {
        const config = authToken
          ? { headers: { Authorization: `Bearer ${authToken}` } }
          : {};

        return await characterServiceClient.get(`/api/character/${characterId}`, config);
      });

      const characterData = response.data;

      // Map Character Service response to Combat Service character
      const character = await this.characterRepository.findOne({
        where: { id: characterId },
      });

      if (character) {
        // Update existing character
        character.name = characterData.name;
        character.health = characterData.health;
        character.mana = characterData.mana;
        character.strength = characterData.totalStrength;
        character.agility = characterData.totalAgility;
        character.intelligence = characterData.totalIntelligence;
        character.faith = characterData.totalFaith;
        character.createdBy = characterData.createdBy;
        character.lastSyncedAt = new Date();

        console.log(`Updated character ${characterId} in Combat Service`);
        return await this.characterRepository.save(character);
      } else {
        // Create new character
        const newCharacter = this.characterRepository.create({
          id: characterData.id,
          name: characterData.name,
          health: characterData.health,
          mana: characterData.mana,
          strength: characterData.totalStrength,
          agility: characterData.totalAgility,
          intelligence: characterData.totalIntelligence,
          faith: characterData.totalFaith,
          createdBy: characterData.createdBy,
          lastSyncedAt: new Date(),
        });

        console.log(`Created character ${characterId} in Combat Service`);
        return await this.characterRepository.save(newCharacter);
      }
    } catch (error: any) {
      console.error(`Failed to sync character ${characterId}:`, error.message);
      throw new Error(`Failed to sync character from Character Service: ${error.message}`);
    }
  }

  async syncIfStale(characterId: string, maxAgeSeconds: number = 300, authToken?: string): Promise<Character> {
    const character = await this.characterRepository.findOne({
      where: { id: characterId },
    });

    if (!character || !character.lastSyncedAt) {
      // Character doesn't exist or has never been synced
      return await this.syncCharacter(characterId, authToken);
    }

    const now = new Date();
    const ageInSeconds = (now.getTime() - character.lastSyncedAt.getTime()) / 1000;

    if (ageInSeconds >= maxAgeSeconds) {
      console.log(`Character ${characterId} is stale (${ageInSeconds.toFixed(0)}s old), syncing...`);
      return await this.syncCharacter(characterId, authToken);
    }

    console.log(`Character ${characterId} is fresh (${ageInSeconds.toFixed(0)}s old), using cached data`);
    return character;
  }

  async getCharacter(characterId: string): Promise<Character | null> {
    return await this.characterRepository.findOne({
      where: { id: characterId },
    });
  }
}
