import { ItemService } from './item.service';
import { AppDataSource } from '../data-source';
import { Item } from '../entities/Item';
import { Character } from '../entities/Character';
import { CharacterService } from './character.service';
import { Repository } from 'typeorm';

jest.mock('../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('./character.service');

describe('ItemService', () => {
  let itemService: ItemService;
  let mockItemRepository: jest.Mocked<Repository<Item>>;
  let mockCharacterRepository: jest.Mocked<Repository<Character>>;
  let mockCharacterService: jest.Mocked<CharacterService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockItemRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    mockCharacterRepository = {
      findOne: jest.fn(),
    } as any;

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Item) return mockItemRepository;
      if (entity === Character) return mockCharacterRepository;
    });

    mockCharacterService = new CharacterService() as jest.Mocked<CharacterService>;
    mockCharacterService.invalidateCharacterCache = jest.fn();

    itemService = new ItemService();
    (itemService as any).characterService = mockCharacterService;
  });

  describe('createItem', () => {
    it('should create an item successfully', async () => {
      const createDto = {
        name: 'Sword',
        description: 'A sharp sword',
        bonusStrength: 10,
        bonusAgility: 5,
        bonusIntelligence: 0,
        bonusFaith: 0,
      };

      const mockItem = {
        id: 'item-id-123',
        ...createDto,
      };

      mockItemRepository.create.mockReturnValue(mockItem as any);
      mockItemRepository.save.mockResolvedValue(mockItem as any);

      const result = await itemService.createItem(createDto);

      expect(mockItemRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockItemRepository.save).toHaveBeenCalledWith(mockItem);
      expect(result).toEqual(mockItem);
    });
  });

  describe('getAllItems', () => {
    it('should return list of all items with display names', async () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Sword',
          description: 'A sword',
          bonusStrength: 10,
          bonusAgility: 0,
          bonusIntelligence: 0,
          bonusFaith: 0,
          characterId: null,
          getDisplayName: jest.fn().mockReturnValue('Sword of Strength'),
        },
        {
          id: 'item-2',
          name: 'Staff',
          description: 'A staff',
          bonusStrength: 0,
          bonusAgility: 0,
          bonusIntelligence: 15,
          bonusFaith: 0,
          characterId: 'char-id-123',
          getDisplayName: jest.fn().mockReturnValue('Staff of Intelligence'),
        },
      ];

      mockItemRepository.find.mockResolvedValue(mockItems as any);

      const result = await itemService.getAllItems();

      expect(mockItemRepository.find).toHaveBeenCalled();
      expect(mockItems[0].getDisplayName).toHaveBeenCalled();
      expect(mockItems[1].getDisplayName).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: 'item-1',
          name: 'Sword',
          displayName: 'Sword of Strength',
          description: 'A sword',
          bonusStrength: 10,
          bonusAgility: 0,
          bonusIntelligence: 0,
          bonusFaith: 0,
          characterId: null,
        },
        {
          id: 'item-2',
          name: 'Staff',
          displayName: 'Staff of Intelligence',
          description: 'A staff',
          bonusStrength: 0,
          bonusAgility: 0,
          bonusIntelligence: 15,
          bonusFaith: 0,
          characterId: 'char-id-123',
        },
      ]);
    });

    it('should return empty array if no items exist', async () => {
      mockItemRepository.find.mockResolvedValue([]);

      const result = await itemService.getAllItems();

      expect(result).toEqual([]);
    });
  });

  describe('getItemById', () => {
    it('should return item by id', async () => {
      const mockItem = {
        id: 'item-id-123',
        name: 'Sword',
        description: 'A sword',
        bonusStrength: 10,
        bonusAgility: 5,
        bonusIntelligence: 0,
        bonusFaith: 0,
        characterId: null,
        getDisplayName: jest.fn().mockReturnValue('Sword of Strength'),
      };

      mockItemRepository.findOne.mockResolvedValue(mockItem as any);

      const result = await itemService.getItemById('item-id-123');

      expect(mockItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'item-id-123' },
      });
      expect(mockItem.getDisplayName).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'item-id-123',
        name: 'Sword',
        displayName: 'Sword of Strength',
        description: 'A sword',
        bonusStrength: 10,
        bonusAgility: 5,
        bonusIntelligence: 0,
        bonusFaith: 0,
        characterId: null,
      });
    });

    it('should throw error if item not found', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(itemService.getItemById('invalid-id')).rejects.toThrow('Item not found');
    });
  });

  describe('grantItem', () => {
    it('should grant item to character successfully', async () => {
      const grantDto = {
        itemId: 'item-id-123',
        characterId: 'char-id-123',
      };

      const mockItem = {
        id: 'item-id-123',
        name: 'Sword',
        characterId: null,
      };

      const mockCharacter = {
        id: 'char-id-123',
        name: 'Hero',
      };

      mockItemRepository.findOne.mockResolvedValue(mockItem as any);
      mockCharacterRepository.findOne.mockResolvedValue(mockCharacter as any);
      mockItemRepository.save.mockResolvedValue(mockItem as any);

      await itemService.grantItem(grantDto);

      expect(mockItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'item-id-123' },
      });
      expect(mockCharacterRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'char-id-123' },
      });
      expect(mockItem.characterId).toBe('char-id-123');
      expect(mockItemRepository.save).toHaveBeenCalledWith(mockItem);
      expect(mockCharacterService.invalidateCharacterCache).toHaveBeenCalledWith('char-id-123');
    });

    it('should throw error if item not found', async () => {
      const grantDto = {
        itemId: 'invalid-item',
        characterId: 'char-id-123',
      };

      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(itemService.grantItem(grantDto)).rejects.toThrow('Item not found');
      expect(mockCharacterRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw error if item already assigned', async () => {
      const grantDto = {
        itemId: 'item-id-123',
        characterId: 'char-id-123',
      };

      const mockItem = {
        id: 'item-id-123',
        characterId: 'other-char-id',
      };

      mockItemRepository.findOne.mockResolvedValue(mockItem as any);

      await expect(itemService.grantItem(grantDto)).rejects.toThrow(
        'Item is already assigned to a character'
      );
      expect(mockCharacterRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw error if character not found', async () => {
      const grantDto = {
        itemId: 'item-id-123',
        characterId: 'invalid-char',
      };

      const mockItem = {
        id: 'item-id-123',
        characterId: null,
      };

      mockItemRepository.findOne.mockResolvedValue(mockItem as any);
      mockCharacterRepository.findOne.mockResolvedValue(null);

      await expect(itemService.grantItem(grantDto)).rejects.toThrow('Character not found');
      expect(mockItemRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('giftItem', () => {
    it('should gift item from one character to another', async () => {
      const giftDto = {
        itemId: 'item-id-123',
        fromCharacterId: 'char-1',
        toCharacterId: 'char-2',
      };

      const mockItem = {
        id: 'item-id-123',
        characterId: 'char-1',
      };

      const mockFromCharacter = {
        id: 'char-1',
        name: 'Hero1',
        createdBy: 'user-id-123',
      };

      const mockToCharacter = {
        id: 'char-2',
        name: 'Hero2',
      };

      mockItemRepository.findOne.mockResolvedValue(mockItem as any);
      mockCharacterRepository.findOne
        .mockResolvedValueOnce(mockFromCharacter as any)
        .mockResolvedValueOnce(mockToCharacter as any);
      mockItemRepository.save.mockResolvedValue(mockItem as any);

      await itemService.giftItem(giftDto, 'user-id-123', false);

      expect(mockItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'item-id-123' },
        relations: ['character'],
      });
      expect(mockItem.characterId).toBe('char-2');
      expect(mockItemRepository.save).toHaveBeenCalledWith(mockItem);
      expect(mockCharacterService.invalidateCharacterCache).toHaveBeenCalledWith('char-1');
      expect(mockCharacterService.invalidateCharacterCache).toHaveBeenCalledWith('char-2');
    });

    it('should allow game master to gift any item', async () => {
      const giftDto = {
        itemId: 'item-id-123',
        fromCharacterId: 'char-1',
        toCharacterId: 'char-2',
      };

      const mockItem = {
        id: 'item-id-123',
        characterId: 'char-1',
      };

      const mockFromCharacter = {
        id: 'char-1',
        createdBy: 'other-user-id',
      };

      const mockToCharacter = {
        id: 'char-2',
      };

      mockItemRepository.findOne.mockResolvedValue(mockItem as any);
      mockCharacterRepository.findOne
        .mockResolvedValueOnce(mockFromCharacter as any)
        .mockResolvedValueOnce(mockToCharacter as any);

      await itemService.giftItem(giftDto, 'gm-user-id', true);

      expect(mockItemRepository.save).toHaveBeenCalled();
    });

    it('should throw error if item not found', async () => {
      const giftDto = {
        itemId: 'invalid-item',
        fromCharacterId: 'char-1',
        toCharacterId: 'char-2',
      };

      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(itemService.giftItem(giftDto, 'user-id', false)).rejects.toThrow(
        'Item not found'
      );
    });

    it('should throw error if item does not belong to source character', async () => {
      const giftDto = {
        itemId: 'item-id-123',
        fromCharacterId: 'char-1',
        toCharacterId: 'char-2',
      };

      const mockItem = {
        id: 'item-id-123',
        characterId: 'different-char',
      };

      mockItemRepository.findOne.mockResolvedValue(mockItem as any);

      await expect(itemService.giftItem(giftDto, 'user-id', false)).rejects.toThrow(
        'Item does not belong to the source character'
      );
    });

    it('should throw error if source character not found', async () => {
      const giftDto = {
        itemId: 'item-id-123',
        fromCharacterId: 'invalid-char',
        toCharacterId: 'char-2',
      };

      const mockItem = {
        id: 'item-id-123',
        characterId: 'invalid-char',
      };

      mockItemRepository.findOne.mockResolvedValue(mockItem as any);
      mockCharacterRepository.findOne.mockResolvedValueOnce(null);

      await expect(itemService.giftItem(giftDto, 'user-id', false)).rejects.toThrow(
        'Source character not found'
      );
    });

    it('should throw error if non-owner tries to gift item', async () => {
      const giftDto = {
        itemId: 'item-id-123',
        fromCharacterId: 'char-1',
        toCharacterId: 'char-2',
      };

      const mockItem = {
        id: 'item-id-123',
        characterId: 'char-1',
      };

      const mockFromCharacter = {
        id: 'char-1',
        createdBy: 'other-user-id',
      };

      mockItemRepository.findOne.mockResolvedValue(mockItem as any);
      mockCharacterRepository.findOne.mockResolvedValueOnce(mockFromCharacter as any);

      await expect(itemService.giftItem(giftDto, 'user-id-123', false)).rejects.toThrow(
        'Forbidden: You can only gift items from your own characters'
      );
    });

    it('should throw error if target character not found', async () => {
      const giftDto = {
        itemId: 'item-id-123',
        fromCharacterId: 'char-1',
        toCharacterId: 'invalid-char',
      };

      const mockItem = {
        id: 'item-id-123',
        characterId: 'char-1',
      };

      const mockFromCharacter = {
        id: 'char-1',
        createdBy: 'user-id-123',
      };

      mockItemRepository.findOne.mockResolvedValue(mockItem as any);
      mockCharacterRepository.findOne
        .mockResolvedValueOnce(mockFromCharacter as any)
        .mockResolvedValueOnce(null);

      await expect(itemService.giftItem(giftDto, 'user-id-123', false)).rejects.toThrow(
        'Target character not found'
      );
    });
  });
});
