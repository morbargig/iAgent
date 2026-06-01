import { Injectable, UnauthorizedException } from '@nestjs/common';
import { getJwtSecret } from './jwt-secret.js';

export interface User {
  userId: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
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

const DEMO_USERS: User[] = [
  {
    userId: 'user_demo_001',
    email: 'demo@iagent.com',
    password: 'demo',
    role: 'user',
    createdAt: new Date('2024-01-01'),
  },
  {
    userId: 'user_test_001',
    email: 'test@iagent.com',
    password: 'test',
    role: 'user',
    createdAt: new Date('2024-01-01'),
  },
];

@Injectable()
export class AuthService {
  private readonly users = DEMO_USERS;

  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { email, password } = loginRequest;

    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const user = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user || user.password !== normalizedPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.userId,
      userId: user.userId,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    };

    return {
      token: this.createSimpleJWT(payload),
      userId: user.userId,
      email: user.email,
      role: user.role,
      expiresIn: '24h',
    };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = this.verifySimpleJWT(token);
      return this.users.find((u) => u.userId === decoded.userId) ?? null;
    } catch {
      return null;
    }
  }

  private createSimpleJWT(payload: Record<string, unknown>): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verifySimpleJWT(token: string): { userId: string; exp?: number } {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [header, payload, signature] = parts;
    const expectedSignature = this.createSignature(`${header}.${payload}`);

    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }

    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      userId: string;
      exp?: number;
    };

    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return decodedPayload;
  }

  private createSignature(data: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', getJwtSecret()).update(data).digest('base64url');
  }
}
