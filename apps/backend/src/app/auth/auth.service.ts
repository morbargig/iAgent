import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface User {
  userId: string;
  email: string;
  password: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  role: string;
  expiresIn: string;
}

interface JwtPayload {
  sub: string;
  userId: string;
  email: string;
  role: string;
}

const DEMO_USER: User = {
  userId: 'user_demo_001',
  email: 'demo@iagent.com',
  password: 'demo',
  role: 'user',
};

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { email, password } = loginRequest;

    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (
      normalizedEmail !== DEMO_USER.email ||
      normalizedPassword !== DEMO_USER.password
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: DEMO_USER.userId,
      userId: DEMO_USER.userId,
      email: DEMO_USER.email,
      role: DEMO_USER.role,
    };

    return {
      token: this.jwtService.sign(payload),
      userId: DEMO_USER.userId,
      email: DEMO_USER.email,
      role: DEMO_USER.role,
      expiresIn: '24h',
    };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);
      const userId = decoded.userId || decoded.sub;
      return userId === DEMO_USER.userId ? DEMO_USER : null;
    } catch {
      return null;
    }
  }
}
