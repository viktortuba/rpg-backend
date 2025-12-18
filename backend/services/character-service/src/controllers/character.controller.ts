import { Request, Response, NextFunction } from 'express';
import { CharacterService } from '../services/character.service';
import { CreateCharacterDto, UserRole } from '../types';

export class CharacterController {
  private characterService = new CharacterService();

  getAllCharacters = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const characters = await this.characterService.getAllCharacters();
      return res.status(200).json(characters);
    } catch (error) {
      next(error);
    }
  };

  getCharacterById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const isGameMaster = req.user!.role === UserRole.GAME_MASTER;

      const character = await this.characterService.getCharacterById(id, userId, isGameMaster);
      return res.status(200).json(character);
    } catch (error: any) {
      if (error.message === 'Character not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.startsWith('Forbidden')) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  };

  createCharacter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateCharacterDto = req.body;
      const userId = req.user!.userId;

      // Validate input
      if (!data.name || !data.classId) {
        return res.status(400).json({
          error: 'Name and classId are required',
        });
      }

      if (typeof data.health !== 'number' || typeof data.mana !== 'number') {
        return res.status(400).json({
          error: 'Health and mana must be numbers',
        });
      }

      if (
        typeof data.baseStrength !== 'number' ||
        typeof data.baseAgility !== 'number' ||
        typeof data.baseIntelligence !== 'number' ||
        typeof data.baseFaith !== 'number'
      ) {
        return res.status(400).json({
          error: 'All base stats must be numbers',
        });
      }

      const character = await this.characterService.createCharacter(data, userId);
      return res.status(201).json(character);
    } catch (error: any) {
      if (error.message === 'Class not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Character name already exists') {
        return res.status(409).json({ error: error.message });
      }
      next(error);
    }
  };
}
