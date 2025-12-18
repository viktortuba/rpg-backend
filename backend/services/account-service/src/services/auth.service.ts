import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entities/User';
import { RegisterDto, LoginDto, AuthResponse, JwtPayload } from '../types';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(data: RegisterDto): Promise<AuthResponse> {
    const { username, password, role = UserRole.USER } = data;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      role,
    });

    await this.userRepository.save(user);

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const { username, password } = data;

    // Find user
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  private generateToken(payload: JwtPayload): string {
    const secret = process.env.JWT_SECRET || 'super-secret-key';
    return jwt.sign(payload, secret, { expiresIn: '24h' });
  }

  verifyToken(token: string): JwtPayload {
    const secret = process.env.JWT_SECRET || 'super-secret-key';
    return jwt.verify(token, secret) as JwtPayload;
  }
}
