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
    });
  }

  async validate(payload: JwtPayload) {
    // In production, you might want to check if user exists in database
    // Return user information from JWT payload
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
} 