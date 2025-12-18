import { CharacterService } from './character.service';
import { AppDataSource } from '../data-source';
import { Character } from '../entities/Character';
import { Class } from '../entities/Class';
import { getCache, setCache, deleteCache } from '../config/redis';
import { Repository } from 'typeorm';

jest.mock('../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../config/redis', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  deleteCache: jest.fn(),
}));

describe('CharacterService', () => {
  let characterService: CharacterService;
  let mockCharacterRepository: jest.Mocked<Repository<Character>>;
  let mockClassRepository: jest.Mocked<Repository<Class>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCharacterRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    mockClassRepository = {
      findOne: jest.fn(),
    } as any;

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Character) return mockCharacterRepository;
      if (entity === Class) return mockClassRepository;
    });

    characterService = new CharacterService();
  });

  describe('createCharacter', () => {
    it('should create a character successfully', async () => {
      const createDto = {
        name: 'TestHero',
        health: 100,
        mana: 50,
        baseStrength: 10,
        baseAgility: 8,
        baseIntelligence: 6,
        baseFaith: 5,
        classId: 'class-id-123',
      };

      const mockClass = {
        id: 'class-id-123',
        name: 'Warrior',
        description: 'A mighty warrior',
      };

      const mockCharacter = {
        id: 'char-id-123',
        ...createDto,
        createdBy: 'user-id-123',
        createdAt: new Date(),
      };

      mockClassRepository.findOne.mockResolvedValue(mockClass as any);
      mockCharacterRepository.findOne.mockResolvedValue(null);
      mockCharacterRepository.create.mockReturnValue(mockCharacter as any);
      mockCharacterRepository.save.mockResolvedValue(mockCharacter as any);

      const result = await characterService.createCharacter(createDto, 'user-id-123');

      expect(mockClassRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-id-123' },
      });
      expect(mockCharacterRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'TestHero' },
      });
      expect(mockCharacterRepository.create).toHaveBeenCalledWith({
        ...createDto,
        createdBy: 'user-id-123',
      });
      expect(mockCharacterRepository.save).toHaveBeenCalledWith(mockCharacter);
      expect(result).toEqual(mockCharacter);
    });

    it('should throw error if class not found', async () => {
      const createDto = {
        name: 'TestHero',
        health: 100,
        mana: 50,
        baseStrength: 10,
        baseAgility: 8,
        baseIntelligence: 6,
        baseFaith: 5,
        classId: 'invalid-class-id',
      };

      mockClassRepository.findOne.mockResolvedValue(null);

      await expect(
        characterService.createCharacter(createDto, 'user-id-123')
      ).rejects.toThrow('Class not found');

      expect(mockCharacterRepository.findOne).not.toHaveBeenCalled();
      expect(mockCharacterRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if character name already exists', async () => {
      const createDto = {
        name: 'ExistingHero',
        health: 100,
        mana: 50,
        baseStrength: 10,
        baseAgility: 8,
        baseIntelligence: 6,
        baseFaith: 5,
        classId: 'class-id-123',
      };

      const mockClass = {
        id: 'class-id-123',
        name: 'Warrior',
      };

      const existingCharacter = {
        id: 'existing-char-id',
        name: 'ExistingHero',
      };

      mockClassRepository.findOne.mockResolvedValue(mockClass as any);
      mockCharacterRepository.findOne.mockResolvedValue(existingCharacter as any);

      await expect(
        characterService.createCharacter(createDto, 'user-id-123')
      ).rejects.toThrow('Character name already exists');

      expect(mockCharacterRepository.create).not.toHaveBeenCalled();
      expect(mockCharacterRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getAllCharacters', () => {
    it('should return list of all characters', async () => {
      const mockCharacters = [
        {
          id: 'char-1',
          name: 'Hero1',
          health: 100,
          mana: 50,
        },
        {
          id: 'char-2',
          name: 'Hero2',
          health: 120,
          mana: 60,
        },
      ];

      mockCharacterRepository.find.mockResolvedValue(mockCharacters as any);

      const result = await characterService.getAllCharacters();

      expect(mockCharacterRepository.find).toHaveBeenCalledWith({
        select: ['id', 'name', 'health', 'mana'],
      });
      expect(result).toEqual([
        { id: 'char-1', name: 'Hero1', health: 100, mana: 50 },
        { id: 'char-2', name: 'Hero2', health: 120, mana: 60 },
      ]);
    });

    it('should return empty array if no characters exist', async () => {
      mockCharacterRepository.find.mockResolvedValue([]);

      const result = await characterService.getAllCharacters();

      expect(result).toEqual([]);
    });
  });

  describe('getCharacterById', () => {
    it('should return character from cache if available', async () => {
      const cachedCharacter = {
        id: 'char-id-123',
        name: 'CachedHero',
        createdBy: 'user-id-123',
      };

      (getCache as jest.Mock).mockResolvedValue(JSON.stringify(cachedCharacter));

      const result = await characterService.getCharacterById(
        'char-id-123',
        'user-id-123',
        false
      );

      expect(getCache).toHaveBeenCalledWith('character:char-id-123');
      expect(result).toEqual(cachedCharacter);
      expect(mockCharacterRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw error if cached character belongs to different user', async () => {
      const cachedCharacter = {
        id: 'char-id-123',
        name: 'OtherHero',
        createdBy: 'other-user-id',
      };

      (getCache as jest.Mock).mockResolvedValue(JSON.stringify(cachedCharacter));

      await expect(
        characterService.getCharacterById('char-id-123', 'user-id-123', false)
      ).rejects.toThrow('Forbidden: You can only view your own characters');
    });

    it('should allow game master to view any character from cache', async () => {
      const cachedCharacter = {
        id: 'char-id-123',
        name: 'AnyHero',
        createdBy: 'other-user-id',
      };

      (getCache as jest.Mock).mockResolvedValue(JSON.stringify(cachedCharacter));

      const result = await characterService.getCharacterById(
        'char-id-123',
        'gm-user-id',
        true
      );

      expect(result).toEqual(cachedCharacter);
    });

    it('should fetch from database and cache if not in cache', async () => {
      const mockCharacter = {
        id: 'char-id-123',
        name: 'DBHero',
        health: 100,
        mana: 50,
        baseStrength: 10,
        baseAgility: 8,
        baseIntelligence: 6,
        baseFaith: 5,
        createdBy: 'user-id-123',
        createdAt: new Date(),
        class: {
          id: 'class-id-123',
          name: 'Warrior',
          description: 'A warrior class',
        },
        items: [],
        calculateTotalStats: jest.fn().mockReturnValue({
          totalStrength: 10,
          totalAgility: 8,
          totalIntelligence: 6,
          totalFaith: 5,
        }),
      };

      (getCache as jest.Mock).mockResolvedValue(null);
      mockCharacterRepository.findOne.mockResolvedValue(mockCharacter as any);

      const result = await characterService.getCharacterById(
        'char-id-123',
        'user-id-123',
        false
      );

      expect(mockCharacterRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'char-id-123' },
        relations: ['class', 'items'],
      });
      expect(mockCharacter.calculateTotalStats).toHaveBeenCalled();
      expect(setCache).toHaveBeenCalledWith(
        'character:char-id-123',
        expect.any(String),
        300
      );
      expect(result.name).toBe('DBHero');
      expect(result.totalStrength).toBe(10);
    });

    it('should throw error if character not found in database', async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      mockCharacterRepository.findOne.mockResolvedValue(null);

      await expect(
        characterService.getCharacterById('invalid-id', 'user-id-123', false)
      ).rejects.toThrow('Character not found');
    });

    it('should throw error if non-GM user tries to view another user character', async () => {
      const mockCharacter = {
        id: 'char-id-123',
        name: 'OtherHero',
        createdBy: 'other-user-id',
        class: {},
        items: [],
        calculateTotalStats: jest.fn(),
      };

      (getCache as jest.Mock).mockResolvedValue(null);
      mockCharacterRepository.findOne.mockResolvedValue(mockCharacter as any);

      await expect(
        characterService.getCharacterById('char-id-123', 'user-id-123', false)
      ).rejects.toThrow('Forbidden: You can only view your own characters');
    });
  });

  describe('invalidateCharacterCache', () => {
    it('should delete character from cache', async () => {
      await characterService.invalidateCharacterCache('char-id-123');

      expect(deleteCache).toHaveBeenCalledWith('character:char-id-123');
    });
  });
});
