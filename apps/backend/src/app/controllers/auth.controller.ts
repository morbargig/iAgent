import { Controller, Get, Post, Body, HttpStatus, BadRequestException, UseGuards } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  getSchemaPath,
  ApiUnauthorizedResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import type { LoginRequest, LoginResponse } from '../auth/auth.service';
import { PermissionsDto } from '../dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User, type AuthUser } from '../decorators/user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and receive JWT token. Demo: demo@iagent.com / demo'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'demo@iagent.com' },
        password: { type: 'string', example: 'demo' }
      },
      required: ['email', 'password']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        userId: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
        expiresIn: { type: 'string' }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials'
  })
  async login(@Body() loginRequest: LoginRequest): Promise<LoginResponse> {
    if (!loginRequest || typeof loginRequest !== 'object') {
      throw new BadRequestException('Invalid request body');
    }
    
    return await this.authService.login(loginRequest);
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user permissions',
    description: 'Returns permissions for the authenticated user based on their role'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions retrieved successfully',
    type: PermissionsDto,
    schema: {
      $ref: getSchemaPath(PermissionsDto)
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required'
  })
  getPermissions(@User() user: AuthUser): PermissionsDto {
    return {
      userId: user.userId,
      role: user.role || 'user',
      permissions: {
        canUseToolT: true,
        canUseToolH: true,
        canUseToolF: true,
        canViewReports: true,
        canManageFilters: true,
      },
    };
  }
}
