import { Request, Response, NextFunction } from 'express';
import { CombatService } from '../services/combat.service';
import { CreateDuelDto, UserRole } from '../types';

export class CombatController {
  private combatService = new CombatService();

  createDuel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateDuelDto = req.body;
      const userId = req.user!.userId;
      const isGameMaster = req.user!.role === UserRole.GAME_MASTER;
      const authToken = req.headers.authorization?.substring(7) || '';

      if (!data.challenger1Id || !data.challenger2Id) {
        return res.status(400).json({
          error: 'challenger1Id and challenger2Id are required',
        });
      }

      if (data.challenger1Id === data.challenger2Id) {
        return res.status(400).json({
          error: 'A character cannot duel itself',
        });
      }

      const duel = await this.combatService.createDuel(
        data.challenger1Id,
        data.challenger2Id,
        userId,
        isGameMaster,
        authToken
      );

      return res.status(201).json(duel);
    } catch (error: any) {
      if (
        error.message.includes('only initiate duels with your own characters') ||
        error.message.includes('already in an active duel')
      ) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Failed to sync character')) {
        return res.status(503).json({ error: 'Character Service unavailable' });
      }
      next(error);
    }
  };

  attack = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { duel_id } = req.params;
      const userId = req.user!.userId;
      const isGameMaster = req.user!.role === UserRole.GAME_MASTER;

      const result = await this.combatService.performAttack(duel_id, userId, isGameMaster);

      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Duel not found') {
        return res.status(404).json({ error: error.message });
      }
      if (
        error.message.includes('not active') ||
        error.message.includes('not your turn') ||
        error.message.includes('timed out')
      ) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  };

  cast = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { duel_id } = req.params;
      const userId = req.user!.userId;
      const isGameMaster = req.user!.role === UserRole.GAME_MASTER;

      const result = await this.combatService.performCast(duel_id, userId, isGameMaster);

      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Duel not found') {
        return res.status(404).json({ error: error.message });
      }
      if (
        error.message.includes('not active') ||
        error.message.includes('not your turn') ||
        error.message.includes('cooldown') ||
        error.message.includes('timed out')
      ) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  };

  heal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { duel_id } = req.params;
      const userId = req.user!.userId;
      const isGameMaster = req.user!.role === UserRole.GAME_MASTER;

      const result = await this.combatService.performHeal(duel_id, userId, isGameMaster);

      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Duel not found') {
        return res.status(404).json({ error: error.message });
      }
      if (
        error.message.includes('not active') ||
        error.message.includes('not your turn') ||
        error.message.includes('cooldown') ||
        error.message.includes('timed out')
      ) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  };

  getDuel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { duel_id } = req.params;
      const userId = req.user!.userId;
      const isGameMaster = req.user!.role === UserRole.GAME_MASTER;

      const duel = await this.combatService.getDuel(duel_id, userId, isGameMaster);

      return res.status(200).json(duel);
    } catch (error: any) {
      if (error.message === 'Duel not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('only view duels involving your characters')) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  };
}
