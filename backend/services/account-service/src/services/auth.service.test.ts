import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entities/User';
import { Repository } from 'typeorm';

jest.mock('../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);

    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        username: 'testuser',
        password: 'password123',
        role: UserRole.USER,
      };

      const hashedPassword = 'hashed_password';
      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        password: hashedPassword,
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'jwt_token_123';

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser as any);
      mockUserRepository.save.mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        username: 'testuser',
        password: hashedPassword,
        role: UserRole.USER,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: 'user-id-123',
          username: 'testuser',
          role: UserRole.USER,
        },
        expect.any(String),
        { expiresIn: '24h' }
      );
      expect(result).toEqual({
        token: mockToken,
        user: {
          id: 'user-id-123',
          username: 'testuser',
          role: UserRole.USER,
        },
      });
    });

    it('should throw error if username already exists', async () => {
      const registerDto = {
        username: 'existinguser',
        password: 'password123',
      };

      const existingUser = {
        id: 'existing-id',
        username: 'existinguser',
        password: 'hashed',
        role: UserRole.USER,
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser as any);

      await expect(authService.register(registerDto)).rejects.toThrow('Username already exists');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should default to USER role if not provided', async () => {
      const registerDto = {
        username: 'newuser',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        username: 'newuser',
        password: 'hashed',
        role: UserRole.USER,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser as any);
      mockUserRepository.save.mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (jwt.sign as jest.Mock).mockReturnValue('token');

      await authService.register(registerDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'hashed',
        role: UserRole.USER,
      });
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        password: 'hashed_password',
        role: UserRole.USER,
      };

      const mockToken = 'jwt_token_123';

      mockUserRepository.findOne.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.login(loginDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: 'user-id-123',
          username: 'testuser',
          role: UserRole.USER,
        },
        expect.any(String),
        { expiresIn: '24h' }
      );
      expect(result).toEqual({
        token: mockToken,
        user: {
          id: 'user-id-123',
          username: 'testuser',
          role: UserRole.USER,
        },
      });
    });

    it('should throw error if user not found', async () => {
      const loginDto = {
        username: 'nonexistent',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if password is invalid', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        password: 'hashed_password',
        role: UserRole.USER,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = 'valid_token';
      const payload = {
        userId: 'user-id-123',
        username: 'testuser',
        role: UserRole.USER,
      };

      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = authService.verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(result).toEqual(payload);
    });

    it('should throw error for invalid token', () => {
      const token = 'invalid_token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.verifyToken(token)).toThrow('Invalid token');
    });
  });
});
