import { Injectable, UnauthorizedException } from '@nestjs/common';

export interface User {
  userId: string;
  email: string;
  password: string; // In real app, this should be hashed
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

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  
  // Demo credentials - Available in all environments including production
  // These are provided for easy testing and demonstration purposes
  private readonly users: User[] = [
    {
      userId: 'user_demo_001',
      email: 'demo@iagent.com',
      password: 'demo',
      role: 'user',
      createdAt: new Date('2024-01-01')
    },
    {
      userId: 'user_test_001',
      email: 'test@iagent.com',
      password: 'test',
      role: 'user',
      createdAt: new Date('2024-01-01')
    }
  ];

  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { email, password } = loginRequest;

    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    // Normalize email (trim and lowercase) for case-insensitive matching
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    // Find user by email (case-insensitive)
    // Demo credentials work in all environments including production
    const user = this.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    if (user.password !== normalizedPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const payload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    // Simple JWT creation (in production, use proper JWT library)
    const token = this.createSimpleJWT(payload);

    return {
      token,
      userId: user.userId,
      email: user.email,
      role: user.role,
      expiresIn: '24h'
    };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = this.verifySimpleJWT(token);
      const user = this.users.find(u => u.userId === decoded.userId);
      return user || null;
    } catch (error) {
      return null;
    }
  }

  // Simple JWT implementation (in production, use jsonwebtoken library)
  private createSimpleJWT(payload: any): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verifySimpleJWT(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [header, payload, signature] = parts;
    const expectedSignature = this.createSignature(`${header}.${payload}`);
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }

    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return decodedPayload;
  }

  private createSignature(data: string): string {
    // Simple signature creation (in production, use proper HMAC)
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', this.JWT_SECRET)
      .update(data)
      .digest('base64url');
  }

} 