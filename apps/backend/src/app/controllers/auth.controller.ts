import { Controller, Get, Post, Body, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  getSchemaPath,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import type { LoginRequest, LoginResponse } from '../auth/auth.service';
import { PermissionsDto } from '../dto/chat.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and receive JWT token'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password' }
      }
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
    return await this.authService.login(loginRequest);
  }

  @Get('permissions')
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
  getPermissions(): PermissionsDto {
    return {
      userId: 'default',
      role: 'user',
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

