import { Router } from 'express';
import { CombatController } from '../controllers/combat.controller';
import { authenticate } from '@rpg-backend/shared';

const router = Router();
const combatController = new CombatController();

// POST /api/challenge - Initiate a duel
router.post('/challenge', authenticate, combatController.createDuel);

// GET /api/duel/:duel_id - Get duel status
router.get('/duel/:duel_id', authenticate, combatController.getDuel);

// POST /api/:duel_id/attack - Perform attack
router.post('/:duel_id/attack', authenticate, combatController.attack);

// POST /api/:duel_id/cast - Cast spell
router.post('/:duel_id/cast', authenticate, combatController.cast);

// POST /api/:duel_id/heal - Heal self
router.post('/:duel_id/heal', authenticate, combatController.heal);

export const combatRouter = router;
