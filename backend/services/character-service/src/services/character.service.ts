import { AppDataSource } from '../data-source';
import { Character } from '../entities/Character';
import { Class } from '../entities/Class';
import { CreateCharacterDto, CharacterListDto, CharacterDetailDto } from '../types';
import { getCache, setCache, deleteCache } from '../config/redis';

export class CharacterService {
  private characterRepository = AppDataSource.getRepository(Character);
  private classRepository = AppDataSource.getRepository(Class);

  async createCharacter(data: CreateCharacterDto, userId: string): Promise<Character> {
    // Validate class exists
    const classEntity = await this.classRepository.findOne({
      where: { id: data.classId },
    });

    if (!classEntity) {
      throw new Error('Class not found');
    }

    // Check if character name already exists
    const existing = await this.characterRepository.findOne({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error('Character name already exists');
    }

    // Create character
    const character = this.characterRepository.create({
      ...data,
      createdBy: userId,
    });

    return await this.characterRepository.save(character);
  }

  async getAllCharacters(): Promise<CharacterListDto[]> {
    const characters = await this.characterRepository.find({
      select: ['id', 'name', 'health', 'mana'],
    });

    return characters.map((char) => ({
      id: char.id,
      name: char.name,
      health: char.health,
      mana: char.mana,
    }));
  }

  async getCharacterById(id: string, userId: string, isGameMaster: boolean): Promise<CharacterDetailDto> {
    // Try cache first
    const cacheKey = `character:${id}`;
    const cached = await getCache(cacheKey);

    if (cached) {
      const character = JSON.parse(cached) as CharacterDetailDto;

      // Check permissions
      if (!isGameMaster && character.createdBy !== userId) {
        throw new Error('Forbidden: You can only view your own characters');
      }

      return character;
    }

    // Fetch from database
    const character = await this.characterRepository.findOne({
      where: { id },
      relations: ['class', 'items'],
    });

    if (!character) {
      throw new Error('Character not found');
    }

    // Check permissions
    if (!isGameMaster && character.createdBy !== userId) {
      throw new Error('Forbidden: You can only view your own characters');
    }

    // Calculate total stats
    const totalStats = character.calculateTotalStats();

    // Build response DTO
    const characterDetail: CharacterDetailDto = {
      id: character.id,
      name: character.name,
      health: character.health,
      mana: character.mana,
      baseStrength: character.baseStrength,
      baseAgility: character.baseAgility,
      baseIntelligence: character.baseIntelligence,
      baseFaith: character.baseFaith,
      ...totalStats,
      class: {
        id: character.class.id,
        name: character.class.name,
        description: character.class.description,
      },
      items: character.items.map((item) => ({
        id: item.id,
        name: item.name,
        displayName: item.getDisplayName(),
        description: item.description,
        bonusStrength: item.bonusStrength,
        bonusAgility: item.bonusAgility,
        bonusIntelligence: item.bonusIntelligence,
        bonusFaith: item.bonusFaith,
      })),
      createdBy: character.createdBy,
      createdAt: character.createdAt,
    };

    // Cache for 5 minutes
    await setCache(cacheKey, JSON.stringify(characterDetail), 300);

    return characterDetail;
  }

  async invalidateCharacterCache(characterId: string): Promise<void> {
    await deleteCache(`character:${characterId}`);
  }
}
