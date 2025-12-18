import { UserRole } from '../entities/User';

// Re-export shared types
export { JwtPayload } from '@rpg-backend/shared';

export interface RegisterDto {
  username: string;
  password: string;
  role?: UserRole;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
  };
}
