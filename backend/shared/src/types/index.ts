export enum UserRole {
  USER = 'User',
  GAME_MASTER = 'GameMaster',
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
}
