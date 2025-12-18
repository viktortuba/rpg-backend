import { Router } from 'express';
import { CharacterController } from '../controllers/character.controller';
import { authenticate, authorize } from '@rpg-backend/shared';
import { UserRole } from '../types';

const router = Router();
const characterController = new CharacterController();

// GET /api/character - List all characters (Game Masters only)
router.get('/', authenticate, authorize(UserRole.GAME_MASTER), characterController.getAllCharacters);

// GET /api/character/:id - Get character details (Game Masters and character owners)
router.get('/:id', authenticate, characterController.getCharacterById);

// POST /api/character - Create a new character (All authenticated users)
router.post('/', authenticate, characterController.createCharacter);

export const characterRouter = router;
