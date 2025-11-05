import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

// Simple JWT-like token decoder for demo purposes
// In production, you'd use proper JWT validation with secret keys
function decodeToken(token: string): { userId: string; email?: string } | null {
  try {
    // Try to decode a base64 encoded JSON token
    if (token.startsWith('eyJ') || token.includes('.')) {
      // This looks like a JWT, but for demo we'll just extract user info differently
      // In production, use proper JWT libraries like @nestjs/jwt
      
      // For now, let's support a simple format: "user_<userId>"
      if (token.startsWith('user_')) {
        return {
          userId: token,
          email: `${token}@demo.com`
        };
      }
      
      // If it looks like base64, try to decode it as JSON
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          // JWT-like structure, decode payload
          const payload = JSON.parse(atob(parts[1]));
          if (payload.userId || payload.sub) {
            return {
              userId: payload.userId || payload.sub,
              email: payload.email
            };
          }
        }
      } catch (e) {
        // If JWT decode fails, fall through to other methods
      }
    }
    
    // For demo: if it contains "user_", treat it as a user ID
    const userIdMatch = token.match(/user_[\w\d]+/);
    if (userIdMatch) {
      return {
        userId: userIdMatch[0],
        email: `${userIdMatch[0]}@demo.com`
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): { userId: string; email?: string } => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      throw new BadRequestException('Authorization header is required');
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new BadRequestException('Bearer token is required');
    }
    
    const user = decodeToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }
    
    return user;
  },
);

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      throw new BadRequestException('Authorization header is required');
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new BadRequestException('Bearer token is required');
    }
    
    const user = decodeToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }
    
    return user.userId;
  },
);

// Swagger documentation decorator for Bearer auth
export const ApiJwtAuth = () => {
  return ApiBearerAuth('JWT-auth');
}; 