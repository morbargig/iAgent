import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // subject (user ID)
  email?: string;
  iat?: number; // issued at
  exp?: number; // expires at
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true, // For demo purposes - in production set to false
      secretOrKey: process.env.JWT_SECRET || 'demo-secret-key-for-development', // In production, use environment variable
      passReqToCallback: true, // Pass request to validate method
    });
  }

  async validate(req: any, payload: JwtPayload | null) {
    // Handle mock tokens
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check if it's a mock token
      if (token.startsWith('mock-token-')) {
        // Extract userId from mock token or use default
        const userIdMatch = token.match(/mock-token-(\d+)/);
        const userId = userIdMatch ? `mock-user-${userIdMatch[1]}` : 'mock-user-default';
        return {
          userId,
          email: `${userId}@example.com`,
        };
      }
      
      // Check if it's a user_ token format
      if (token.startsWith('user_') || token.startsWith('mock-user-')) {
        return {
          userId: token.replace('Bearer ', ''),
          email: `${token}@example.com`,
        };
      }
    }
    
    // If no payload (JWT validation failed) but we have a token, try to extract user info
    if (!payload) {
      return null;
    }
    
    // In production, you might want to check if user exists in database
    // Return user information from JWT payload
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
} 