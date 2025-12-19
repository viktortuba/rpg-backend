import { JwtPayload } from '@rpg-backend/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
