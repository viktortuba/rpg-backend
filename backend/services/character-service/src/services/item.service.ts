import { AppDataSource } from '../data-source';
import { Item } from '../entities/Item';
import { Character } from '../entities/Character';
import { CreateItemDto, ItemDto, GrantItemDto, GiftItemDto } from '../types';
import { CharacterService } from './character.service';

export class ItemService {
  private itemRepository = AppDataSource.getRepository(Item);
  private characterRepository = AppDataSource.getRepository(Character);
  private characterService = new CharacterService();

  async createItem(data: CreateItemDto): Promise<Item> {
    const item = this.itemRepository.create(data);
    return await this.itemRepository.save(item);
  }

  async getAllItems(): Promise<ItemDto[]> {
    const items = await this.itemRepository.find();

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      displayName: item.getDisplayName(),
      description: item.description,
      bonusStrength: item.bonusStrength,
      bonusAgility: item.bonusAgility,
      bonusIntelligence: item.bonusIntelligence,
      bonusFaith: item.bonusFaith,
      characterId: item.characterId,
    }));
  }

  async getItemById(id: string): Promise<ItemDto> {
    const item = await this.itemRepository.findOne({
      where: { id },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    return {
      id: item.id,
      name: item.name,
      displayName: item.getDisplayName(),
      description: item.description,
      bonusStrength: item.bonusStrength,
      bonusAgility: item.bonusAgility,
      bonusIntelligence: item.bonusIntelligence,
      bonusFaith: item.bonusFaith,
      characterId: item.characterId,
    };
  }

  async grantItem(data: GrantItemDto): Promise<void> {
    const item = await this.itemRepository.findOne({
      where: { id: data.itemId },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    if (item.characterId) {
      throw new Error('Item is already assigned to a character');
    }

    const character = await this.characterRepository.findOne({
      where: { id: data.characterId },
    });

    if (!character) {
      throw new Error('Character not found');
    }

    item.characterId = data.characterId;
    await this.itemRepository.save(item);

    // Invalidate character cache
    await this.characterService.invalidateCharacterCache(data.characterId);
  }

  async giftItem(data: GiftItemDto, userId: string, isGameMaster: boolean): Promise<void> {
    const item = await this.itemRepository.findOne({
      where: { id: data.itemId },
      relations: ['character'],
    });

    if (!item) {
      throw new Error('Item not found');
    }

    if (!item.characterId || item.characterId !== data.fromCharacterId) {
      throw new Error('Item does not belong to the source character');
    }

    const fromCharacter = await this.characterRepository.findOne({
      where: { id: data.fromCharacterId },
    });

    if (!fromCharacter) {
      throw new Error('Source character not found');
    }

    // Check permissions - only owner or game master can gift items
    if (!isGameMaster && fromCharacter.createdBy !== userId) {
      throw new Error('Forbidden: You can only gift items from your own characters');
    }

    const toCharacter = await this.characterRepository.findOne({
      where: { id: data.toCharacterId },
    });

    if (!toCharacter) {
      throw new Error('Target character not found');
    }

    item.characterId = data.toCharacterId;
    await this.itemRepository.save(item);

    // Invalidate both character caches
    await this.characterService.invalidateCharacterCache(data.fromCharacterId);
    await this.characterService.invalidateCharacterCache(data.toCharacterId);
  }
}
