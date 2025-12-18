import { Router } from 'express';
import { ItemController } from '../controllers/item.controller';
import { authenticate, authorize } from '@rpg-backend/shared';
import { UserRole } from '../types';

const router = Router();
const itemController = new ItemController();

// GET /api/items - List all items (Game Masters only)
router.get('/', authenticate, authorize(UserRole.GAME_MASTER), itemController.getAllItems);

// GET /api/items/:id - Get item details
router.get('/:id', authenticate, itemController.getItemById);

// POST /api/items - Create a new item (Game Masters only)
router.post('/', authenticate, authorize(UserRole.GAME_MASTER), itemController.createItem);

// POST /api/items/grant - Grant an item to a character (Game Masters only)
router.post('/grant', authenticate, authorize(UserRole.GAME_MASTER), itemController.grantItem);

// POST /api/items/gift - Transfer an item from one character to another (Character owners or Game Masters)
router.post('/gift', authenticate, itemController.giftItem);

export const itemRouter = router;
