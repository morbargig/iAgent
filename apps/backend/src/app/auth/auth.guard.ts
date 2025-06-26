import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    role?: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    
    // Extract token from Authorization header or body
    let token: string | undefined;
    
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.body?.auth?.token) {
      token = request.body.auth.token;
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }

    try {
      const user = await this.authService.validateToken(token);
      
      if (!user) {
        throw new UnauthorizedException('Invalid or expired token');
      }
      
      // Attach user info to request
      request.user = {
        userId: user.userId,
        email: user.email,
        role: user.role
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
} 