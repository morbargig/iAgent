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
  
  // Mock users database - In production, use a real database
  private readonly users: User[] = [
    // Add your users here
    // Example:
    // {
    //   userId: 'user_123456789',
    //   email: 'user@example.com',
    //   password: 'password', // In production: hash this with bcrypt
    //   role: 'user',
    //   createdAt: new Date()
    // }
  ];

  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { email, password } = loginRequest;

    // Find user by email
    const user = this.users.find(u => u.email === email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password (in production, use bcrypt.compare)
    if (user.password !== password) {
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