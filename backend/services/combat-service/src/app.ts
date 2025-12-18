import express, { Request, Response } from 'express';
import { combatRouter } from './routes/combat.routes';
import { errorHandler, notFoundHandler } from '@rpg-backend/shared';

export const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (_req: Request, res: Response) => res.json({ status: 'OK' }));
app.use('/api', combatRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);
