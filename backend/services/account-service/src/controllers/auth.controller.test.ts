import { Request, Response, NextFunction } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../entities/User';

jest.mock('../services/auth.service');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthService = new AuthService() as jest.Mocked<AuthService>;
    authController = new AuthController();
    (authController as any).authService = mockAuthService;

    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        username: 'testuser',
        password: 'password123',
        role: UserRole.USER,
      };

      const mockAuthResponse = {
        token: 'jwt_token',
        user: {
          id: 'user-id-123',
          username: 'testuser',
          role: UserRole.USER,
        },
      };

      mockRequest.body = registerData;
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAuthResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if username is missing', async () => {
      mockRequest.body = {
        password: 'password123',
      };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Username and password are required',
      });
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should return 400 if password is missing', async () => {
      mockRequest.body = {
        username: 'testuser',
      };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Username and password are required',
      });
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should return 400 if password is too short', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: '12345',
      };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Password must be at least 6 characters long',
      });
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should return 409 if username already exists', async () => {
      mockRequest.body = {
        username: 'existinguser',
        password: 'password123',
      };

      mockAuthService.register.mockRejectedValue(new Error('Username already exists'));

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Username already exists',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error for unexpected errors', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };

      const unexpectedError = new Error('Database connection failed');
      mockAuthService.register.mockRejectedValue(unexpectedError);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123',
      };

      const mockAuthResponse = {
        token: 'jwt_token',
        user: {
          id: 'user-id-123',
          username: 'testuser',
          role: UserRole.USER,
        },
      };

      mockRequest.body = loginData;
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAuthResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if username is missing', async () => {
      mockRequest.body = {
        password: 'password123',
      };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Username and password are required',
      });
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should return 400 if password is missing', async () => {
      mockRequest.body = {
        username: 'testuser',
      };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Username and password are required',
      });
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid credentials', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid credentials',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error for unexpected errors', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };

      const unexpectedError = new Error('Database connection failed');
      mockAuthService.login.mockRejectedValue(unexpectedError);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });
});
