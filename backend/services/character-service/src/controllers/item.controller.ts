import { Request, Response, NextFunction } from 'express';
import { ItemService } from '../services/item.service';
import { CreateItemDto, GrantItemDto, GiftItemDto, UserRole } from '../types';

export class ItemController {
  private itemService = new ItemService();

  getAllItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.itemService.getAllItems();
      return res.status(200).json(items);
    } catch (error) {
      next(error);
    }
  };

  getItemById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await this.itemService.getItemById(id);
      return res.status(200).json(item);
    } catch (error: any) {
      if (error.message === 'Item not found') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  };

  createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateItemDto = req.body;

      // Validate input
      if (!data.name || !data.description) {
        return res.status(400).json({
          error: 'Name and description are required',
        });
      }

      if (
        typeof data.bonusStrength !== 'number' ||
        typeof data.bonusAgility !== 'number' ||
        typeof data.bonusIntelligence !== 'number' ||
        typeof data.bonusFaith !== 'number'
      ) {
        return res.status(400).json({
          error: 'All bonus stats must be numbers',
        });
      }

      const item = await this.itemService.createItem(data);
      return res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  };

  grantItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: GrantItemDto = req.body;

      if (!data.itemId || !data.characterId) {
        return res.status(400).json({
          error: 'itemId and characterId are required',
        });
      }

      await this.itemService.grantItem(data);
      return res.status(200).json({ message: 'Item granted successfully' });
    } catch (error: any) {
      if (error.message === 'Item not found' || error.message === 'Character not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Item is already assigned to a character') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  };

  giftItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: GiftItemDto = req.body;
      const userId = req.user!.userId;
      const isGameMaster = req.user!.role === UserRole.GAME_MASTER;

      if (!data.itemId || !data.fromCharacterId || !data.toCharacterId) {
        return res.status(400).json({
          error: 'itemId, fromCharacterId, and toCharacterId are required',
        });
      }

      await this.itemService.giftItem(data, userId, isGameMaster);
      return res.status(200).json({ message: 'Item gifted successfully' });
    } catch (error: any) {
      if (
        error.message === 'Item not found' ||
        error.message === 'Source character not found' ||
        error.message === 'Target character not found'
      ) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Item does not belong to the source character') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.startsWith('Forbidden')) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  };
}
