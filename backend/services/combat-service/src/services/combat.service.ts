import { AppDataSource } from '../data-source';
import { Duel, DuelStatus, DuelTurn } from '../entities/Duel';
import { CombatAction } from '../entities/DuelLog';
import { CharacterClientService } from './character-sync.service';
import { DuelLogService } from './duel-log.service';
import { DuelResponseDto, CharacterSyncDto } from '../types';
import { characterServiceClient, retryWithBackoff } from '../config/http-client';

export class CombatService {
  private duelRepository = AppDataSource.getRepository(Duel);
  private characterClient = new CharacterClientService();
  private duelLogService = new DuelLogService();

  async createDuel(
    challenger1Id: string,
    challenger2Id: string,
    userId: string,
    isGameMaster: boolean,
    authToken: string
  ): Promise<DuelResponseDto> {
    console.log(`Creating duel between ${challenger1Id} and ${challenger2Id}`);

    // Fetch both characters from Character Service
    const char1 = await this.characterClient.getCharacter(challenger1Id, authToken);
    const char2 = await this.characterClient.getCharacter(challenger2Id, authToken);

    // Validate user owns challenger1 (unless game master)
    if (!isGameMaster && char1.createdBy !== userId) {
      throw new Error('You can only initiate duels with your own characters');
    }

    // Check if either character is in an active duel
    const activeDuels = await this.duelRepository.find({
      where: [
        { challenger1Id, status: DuelStatus.ACTIVE },
        { challenger2Id, status: DuelStatus.ACTIVE },
        { challenger1Id: challenger2Id, status: DuelStatus.ACTIVE },
        { challenger2Id: challenger1Id, status: DuelStatus.ACTIVE },
      ],
    });

    if (activeDuels.length > 0) {
      throw new Error('One or both characters are already in an active duel');
    }

    // Create duel with character snapshot data
    const duel = this.duelRepository.create({
      challenger1Id,
      challenger2Id,
      // Cache character data at duel creation
      challenger1Name: char1.name,
      challenger2Name: char2.name,
      challenger1CreatedBy: char1.createdBy,
      challenger2CreatedBy: char2.createdBy,
      challenger1MaxHealth: char1.health,
      challenger2MaxHealth: char2.health,
      challenger1TotalStrength: char1.totalStrength,
      challenger2TotalStrength: char2.totalStrength,
      challenger1TotalAgility: char1.totalAgility,
      challenger2TotalAgility: char2.totalAgility,
      challenger1TotalIntelligence: char1.totalIntelligence,
      challenger2TotalIntelligence: char2.totalIntelligence,
      challenger1TotalFaith: char1.totalFaith,
      challenger2TotalFaith: char2.totalFaith,
      // Combat state
      currentTurn: DuelTurn.CHALLENGER_1,
      challenger1Health: char1.health,
      challenger2Health: char2.health,
      status: DuelStatus.ACTIVE,
      startedAt: new Date(),
      challenger1LastAction: null,
      challenger2LastAction: null,
      challenger1LastCast: null,
      challenger2LastCast: null,
      challenger1LastHeal: null,
      challenger2LastHeal: null,
      winnerId: null,
      endedAt: null,
    });

    const savedDuel = await this.duelRepository.save(duel);
    console.log(`Duel ${savedDuel.id} created successfully`);

    return this.buildDuelResponse(savedDuel, char1, char2);
  }

  async performAttack(duelId: string, userId: string, isGameMaster: boolean, authToken: string): Promise<any> {
    const duel = await this.getDuel(duelId);
    this.validateDuelActive(duel);
    this.checkTimeout(duel);

    // Use cached character data from duel
    const { attacker, defender, isChallenger1 } = this.validateTurnCached(duel, userId, isGameMaster);

    // Attack has no cooldown
    const damage = attacker.totalStrength + attacker.totalAgility;
    const newDefenderHealth = Math.max(0, this.getDefenderHealth(duel, isChallenger1) - damage);

    this.setDefenderHealth(duel, isChallenger1, newDefenderHealth);
    this.setLastAction(duel, isChallenger1, new Date());

    // Log action
    await this.duelLogService.logAction(duelId, attacker.characterId, CombatAction.ATTACK, newDefenderHealth, damage);

    // Check win condition
    const winResult = await this.checkWinConditionCached(duel);
    if (winResult) {
      return {
        action: CombatAction.ATTACK,
        actor: attacker.name,
        target: defender.name,
        damage,
        message: `${attacker.name} attacks ${defender.name} for ${damage} damage!`,
        ...winResult,
      };
    }

    // Switch turn
    this.switchTurn(duel);
    await this.duelRepository.save(duel);

    return {
      action: CombatAction.ATTACK,
      actor: attacker.name,
      target: defender.name,
      damage,
      message: `${attacker.name} attacks ${defender.name} for ${damage} damage!`,
      duel: this.buildDuelResponseCached(duel),
    };
  }

  async performCast(duelId: string, userId: string, isGameMaster: boolean, authToken: string): Promise<any> {
    const duel = await this.getDuel(duelId);
    this.validateDuelActive(duel);
    this.checkTimeout(duel);

    // Use cached character data from duel
    const { attacker, defender, isChallenger1 } = this.validateTurnCached(duel, userId, isGameMaster);

    // Check cast cooldown (2 seconds)
    const lastCast = isChallenger1 ? duel.challenger1LastCast : duel.challenger2LastCast;
    if (!this.canPerformAction(lastCast, 2)) {
      const remaining = this.getRemainingCooldown(lastCast, 2);
      throw new Error(`Cast is on cooldown. ${remaining.toFixed(1)} seconds remaining.`);
    }

    const damage = 2 * attacker.totalIntelligence;
    const newDefenderHealth = Math.max(0, this.getDefenderHealth(duel, isChallenger1) - damage);

    this.setDefenderHealth(duel, isChallenger1, newDefenderHealth);
    this.setLastAction(duel, isChallenger1, new Date());
    this.setLastCast(duel, isChallenger1, new Date());

    // Log action
    await this.duelLogService.logAction(duelId, attacker.characterId, CombatAction.CAST, newDefenderHealth, damage);

    // Check win condition
    const winResult = await this.checkWinConditionCached(duel);
    if (winResult) {
      return {
        action: CombatAction.CAST,
        actor: attacker.name,
        target: defender.name,
        damage,
        message: `${attacker.name} casts a spell on ${defender.name} for ${damage} damage!`,
        ...winResult,
      };
    }

    // Switch turn
    this.switchTurn(duel);
    await this.duelRepository.save(duel);

    return {
      action: CombatAction.CAST,
      actor: attacker.name,
      target: defender.name,
      damage,
      message: `${attacker.name} casts a spell on ${defender.name} for ${damage} damage!`,
      duel: this.buildDuelResponseCached(duel),
    };
  }

  async performHeal(duelId: string, userId: string, isGameMaster: boolean, authToken: string): Promise<any> {
    const duel = await this.getDuel(duelId);
    this.validateDuelActive(duel);
    this.checkTimeout(duel);

    // Use cached character data from duel
    const { attacker, defender, isChallenger1 } = this.validateTurnCached(duel, userId, isGameMaster);

    // Check heal cooldown (2 seconds)
    const lastHeal = isChallenger1 ? duel.challenger1LastHeal : duel.challenger2LastHeal;
    if (!this.canPerformAction(lastHeal, 2)) {
      const remaining = this.getRemainingCooldown(lastHeal, 2);
      throw new Error(`Heal is on cooldown. ${remaining.toFixed(1)} seconds remaining.`);
    }

    const healing = attacker.totalFaith;
    const currentHealth = isChallenger1 ? duel.challenger1Health : duel.challenger2Health;
    const maxHealth = attacker.health;
    const newHealth = Math.min(maxHealth, currentHealth + healing);
    const actualHealing = newHealth - currentHealth;

    if (isChallenger1) {
      duel.challenger1Health = newHealth;
    } else {
      duel.challenger2Health = newHealth;
    }

    this.setLastAction(duel, isChallenger1, new Date());
    this.setLastHeal(duel, isChallenger1, new Date());

    // Log action
    await this.duelLogService.logAction(duelId, attacker.characterId, CombatAction.HEAL, newHealth, undefined, actualHealing);

    // Switch turn (healing doesn't end the duel)
    this.switchTurn(duel);
    await this.duelRepository.save(duel);

    return {
      action: CombatAction.HEAL,
      actor: attacker.name,
      healing: actualHealing,
      message: `${attacker.name} heals for ${actualHealing} health!`,
      duel: this.buildDuelResponseCached(duel),
    };
  }

  async getDuelStatus(duelId: string, userId: string, isGameMaster: boolean, authToken: string): Promise<DuelResponseDto> {
    const duel = await this.getDuel(duelId);

    // Check authorization using cached data
    if (!isGameMaster && duel.challenger1CreatedBy !== userId && duel.challenger2CreatedBy !== userId) {
      throw new Error('You can only view duels involving your characters');
    }

    return this.buildDuelResponseCached(duel);
  }

  // Helper methods

  private async getDuel(duelId: string): Promise<Duel> {
    const duel = await this.duelRepository.findOne({
      where: { id: duelId },
    });

    if (!duel) {
      throw new Error('Duel not found');
    }

    return duel;
  }

  private validateDuelActive(duel: Duel): void {
    if (duel.status !== DuelStatus.ACTIVE) {
      throw new Error('Duel is not active');
    }
  }

  private checkTimeout(duel: Duel): void {
    const now = new Date();
    const durationSeconds = (now.getTime() - duel.startedAt.getTime()) / 1000;

    if (durationSeconds >= 300) {
      // 5 minutes timeout
      duel.status = DuelStatus.DRAW;
      duel.endedAt = now;
      this.duelRepository.save(duel);
      throw new Error('Duel timed out after 5 minutes and ended in a draw');
    }
  }

  private validateTurn(duel: Duel, char1: CharacterSyncDto, char2: CharacterSyncDto, userId: string, isGameMaster: boolean) {
    const isChallenger1Turn = duel.currentTurn === DuelTurn.CHALLENGER_1;
    const currentCharacter = isChallenger1Turn ? char1 : char2;
    const otherCharacter = isChallenger1Turn ? char2 : char1;

    if (!isGameMaster && currentCharacter.createdBy !== userId) {
      throw new Error('It is not your turn');
    }

    return {
      attacker: currentCharacter,
      defender: otherCharacter,
      isChallenger1: isChallenger1Turn,
    };
  }

  private validateTurnCached(duel: Duel, userId: string, isGameMaster: boolean) {
    const isChallenger1Turn = duel.currentTurn === DuelTurn.CHALLENGER_1;

    // Check authorization using cached createdBy
    const currentCreatedBy = isChallenger1Turn ? duel.challenger1CreatedBy : duel.challenger2CreatedBy;
    if (!isGameMaster && currentCreatedBy !== userId) {
      throw new Error('It is not your turn');
    }

    // Build attacker and defender from cached data
    const attacker = isChallenger1Turn ? {
      characterId: duel.challenger1Id,
      name: duel.challenger1Name,
      createdBy: duel.challenger1CreatedBy,
      health: duel.challenger1MaxHealth,
      totalStrength: duel.challenger1TotalStrength,
      totalAgility: duel.challenger1TotalAgility,
      totalIntelligence: duel.challenger1TotalIntelligence,
      totalFaith: duel.challenger1TotalFaith,
    } : {
      characterId: duel.challenger2Id,
      name: duel.challenger2Name,
      createdBy: duel.challenger2CreatedBy,
      health: duel.challenger2MaxHealth,
      totalStrength: duel.challenger2TotalStrength,
      totalAgility: duel.challenger2TotalAgility,
      totalIntelligence: duel.challenger2TotalIntelligence,
      totalFaith: duel.challenger2TotalFaith,
    };

    const defender = isChallenger1Turn ? {
      characterId: duel.challenger2Id,
      name: duel.challenger2Name,
      createdBy: duel.challenger2CreatedBy,
      health: duel.challenger2MaxHealth,
      totalStrength: duel.challenger2TotalStrength,
      totalAgility: duel.challenger2TotalAgility,
      totalIntelligence: duel.challenger2TotalIntelligence,
      totalFaith: duel.challenger2TotalFaith,
    } : {
      characterId: duel.challenger1Id,
      name: duel.challenger1Name,
      createdBy: duel.challenger1CreatedBy,
      health: duel.challenger1MaxHealth,
      totalStrength: duel.challenger1TotalStrength,
      totalAgility: duel.challenger1TotalAgility,
      totalIntelligence: duel.challenger1TotalIntelligence,
      totalFaith: duel.challenger1TotalFaith,
    };

    return {
      attacker,
      defender,
      isChallenger1: isChallenger1Turn,
    };
  }

  private canPerformAction(lastActionTime: Date | null, cooldownSeconds: number): boolean {
    if (!lastActionTime) return true;

    const now = new Date();
    const elapsed = (now.getTime() - lastActionTime.getTime()) / 1000;
    return elapsed >= cooldownSeconds;
  }

  private getRemainingCooldown(lastActionTime: Date | null, cooldownSeconds: number): number {
    if (!lastActionTime) return 0;

    const now = new Date();
    const elapsed = (now.getTime() - lastActionTime.getTime()) / 1000;
    return Math.max(0, cooldownSeconds - elapsed);
  }

  private getDefenderHealth(duel: Duel, isAttackerChallenger1: boolean): number {
    return isAttackerChallenger1 ? duel.challenger2Health : duel.challenger1Health;
  }

  private setDefenderHealth(duel: Duel, isAttackerChallenger1: boolean, health: number): void {
    if (isAttackerChallenger1) {
      duel.challenger2Health = health;
    } else {
      duel.challenger1Health = health;
    }
  }

  private setLastAction(duel: Duel, isChallenger1: boolean, time: Date): void {
    if (isChallenger1) {
      duel.challenger1LastAction = time;
    } else {
      duel.challenger2LastAction = time;
    }
  }

  private setLastCast(duel: Duel, isChallenger1: boolean, time: Date): void {
    if (isChallenger1) {
      duel.challenger1LastCast = time;
    } else {
      duel.challenger2LastCast = time;
    }
  }

  private setLastHeal(duel: Duel, isChallenger1: boolean, time: Date): void {
    if (isChallenger1) {
      duel.challenger1LastHeal = time;
    } else {
      duel.challenger2LastHeal = time;
    }
  }

  private switchTurn(duel: Duel): void {
    duel.currentTurn =
      duel.currentTurn === DuelTurn.CHALLENGER_1 ? DuelTurn.CHALLENGER_2 : DuelTurn.CHALLENGER_1;
  }

  private async checkWinCondition(duel: Duel, char1: CharacterSyncDto, char2: CharacterSyncDto): Promise<any | null> {
    if (duel.challenger1Health <= 0) {
      return await this.completeDuel(duel, duel.challenger2Id, char1, char2, 'health');
    }

    if (duel.challenger2Health <= 0) {
      return await this.completeDuel(duel, duel.challenger1Id, char1, char2, 'health');
    }

    return null;
  }

  private async completeDuel(duel: Duel, winnerId: string, char1: CharacterSyncDto, char2: CharacterSyncDto, reason: string): Promise<any> {
    console.log(`Duel ${duel.id} completed. Winner: ${winnerId} (Reason: ${reason})`);

    duel.status = DuelStatus.COMPLETED;
    duel.winnerId = winnerId;
    duel.endedAt = new Date();
    await this.duelRepository.save(duel);

    const loserId = winnerId === duel.challenger1Id ? duel.challenger2Id : duel.challenger1Id;
    const winnerName = winnerId === duel.challenger1Id ? char1.name : char2.name;

    // Transfer random item (fire and forget, log errors)
    this.transferRandomItem(winnerId, loserId).catch((error) => {
      console.error(`Failed to transfer item after duel ${duel.id}:`, error.message);
    });

    return {
      duel: this.buildDuelResponse(duel, char1, char2),
      winner: winnerName,
      message: `${winnerName} wins the duel!`,
    };
  }

  private async transferRandomItem(winnerId: string, loserId: string): Promise<void> {
    console.log(`Attempting to transfer random item from ${loserId} to ${winnerId}...`);

    try {
      await retryWithBackoff(async () => {
        // Get loser's character to check items
        const response = await characterServiceClient.get(`/api/character/${loserId}`);
        const loserCharacter = response.data;

        if (!loserCharacter.items || loserCharacter.items.length === 0) {
          console.log(`Loser ${loserId} has no items to transfer`);
          return;
        }

        // Select random item
        const randomIndex = Math.floor(Math.random() * loserCharacter.items.length);
        const randomItem = loserCharacter.items[randomIndex];

        console.log(`Transferring item ${randomItem.id} (${randomItem.displayName}) from ${loserId} to ${winnerId}`);

        // Transfer item via gift endpoint
        await characterServiceClient.post('/api/items/gift', {
          itemId: randomItem.id,
          fromCharacterId: loserId,
          toCharacterId: winnerId,
        });

        console.log(`Successfully transferred item ${randomItem.id} to winner ${winnerId}`);
      }, 3, 1000);
    } catch (error: any) {
      console.error(`Failed to transfer item after all retries:`, error.message);
      throw error;
    }
  }

  private buildDuelResponse(duel: Duel, char1: CharacterSyncDto, char2: CharacterSyncDto): DuelResponseDto {
    return {
      id: duel.id,
      challenger1: {
        id: char1.id,
        name: char1.name,
        currentHealth: duel.challenger1Health,
        maxHealth: char1.health,
      },
      challenger2: {
        id: char2.id,
        name: char2.name,
        currentHealth: duel.challenger2Health,
        maxHealth: char2.health,
      },
      currentTurn: duel.currentTurn,
      status: duel.status,
      winnerId: duel.winnerId || undefined,
      startedAt: duel.startedAt,
      endedAt: duel.endedAt || undefined,
    };
  }

  private buildDuelResponseCached(duel: Duel): DuelResponseDto {
    return {
      id: duel.id,
      challenger1: {
        id: duel.challenger1Id,
        name: duel.challenger1Name,
        currentHealth: duel.challenger1Health,
        maxHealth: duel.challenger1MaxHealth,
      },
      challenger2: {
        id: duel.challenger2Id,
        name: duel.challenger2Name,
        currentHealth: duel.challenger2Health,
        maxHealth: duel.challenger2MaxHealth,
      },
      currentTurn: duel.currentTurn,
      status: duel.status,
      winnerId: duel.winnerId || undefined,
      startedAt: duel.startedAt,
      endedAt: duel.endedAt || undefined,
    };
  }

  private async checkWinConditionCached(duel: Duel): Promise<any | null> {
    if (duel.challenger1Health <= 0) {
      return await this.completeDuelCached(duel, duel.challenger2Id, 'health');
    }

    if (duel.challenger2Health <= 0) {
      return await this.completeDuelCached(duel, duel.challenger1Id, 'health');
    }

    return null;
  }

  private async completeDuelCached(duel: Duel, winnerId: string, reason: string): Promise<any> {
    console.log(`Duel ${duel.id} completed. Winner: ${winnerId} (Reason: ${reason})`);

    duel.status = DuelStatus.COMPLETED;
    duel.winnerId = winnerId;
    duel.endedAt = new Date();
    await this.duelRepository.save(duel);

    const loserId = winnerId === duel.challenger1Id ? duel.challenger2Id : duel.challenger1Id;
    const winnerName = winnerId === duel.challenger1Id ? duel.challenger1Name : duel.challenger2Name;

    // Transfer random item (fire and forget, log errors)
    this.transferRandomItem(winnerId, loserId).catch((error) => {
      console.error(`Failed to transfer item after duel ${duel.id}:`, error.message);
    });

    return {
      duel: this.buildDuelResponseCached(duel),
      winner: winnerName,
      message: `${winnerName} wins the duel!`,
    };
  }
}
