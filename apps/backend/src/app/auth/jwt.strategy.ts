import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '../../config/env';

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
      secretOrKey: env.JWT_SECRET, // In production, use environment variable
    });
  }

  async validate(payload: JwtPayload) {
    // In production, you might want to check if user exists in database
    // For demo purposes, we'll accept any valid JWT payload

    // Handle demo token
    if (payload.sub === 'user_123456789') {
      return {
        userId: payload.sub,
        email: payload.email || 'demo@example.com',
      };
    }

    // Handle regular JWT tokens
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
} 