import { AppDataSource } from '../data-source';
import { DuelLog, CombatAction } from '../entities/DuelLog';

export class DuelLogService {
  private duelLogRepository = AppDataSource.getRepository(DuelLog);

  async logAction(
    duelId: string,
    characterId: string,
    action: CombatAction,
    targetHealth: number,
    damage?: number,
    healing?: number
  ): Promise<DuelLog> {
    const log = this.duelLogRepository.create({
      duelId,
      characterId,
      action,
      damage: damage || null,
      healing: healing || null,
      targetHealth,
      timestamp: new Date(),
    });

    const savedLog = await this.duelLogRepository.save(log);

    console.log(
      `[COMBAT LOG] Duel ${duelId}: Character ${characterId} performed ${action}` +
        (damage ? ` for ${damage} damage` : '') +
        (healing ? ` for ${healing} healing` : '') +
        ` (Target health: ${targetHealth})`
    );

    return savedLog;
  }

  async getDuelLogs(duelId: string): Promise<DuelLog[]> {
    return await this.duelLogRepository.find({
      where: { duelId },
      order: { timestamp: 'ASC' },
    });
  }
}
