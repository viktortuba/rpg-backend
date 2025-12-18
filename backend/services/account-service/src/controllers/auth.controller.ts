import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto } from '../types';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: RegisterDto = req.body;

      // Validate input
      if (!data.username || !data.password) {
        return res.status(400).json({
          error: 'Username and password are required',
        });
      }

      if (data.password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters long',
        });
      }

      const result = await this.authService.register(data);

      return res.status(201).json(result);
    } catch (error: any) {
      if (error.message === 'Username already exists') {
        return res.status(409).json({ error: error.message });
      }
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: LoginDto = req.body;

      // Validate input
      if (!data.username || !data.password) {
        return res.status(400).json({
          error: 'Username and password are required',
        });
      }

      const result = await this.authService.login(data);

      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: error.message });
      }
      next(error);
    }
  };
}
