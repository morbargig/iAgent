import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { environment } from '../environments/environment';
import { HealthCheckDto, VersionDto } from './dto/chat.dto';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the health status and available endpoints of the API'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
    type: HealthCheckDto,
    schema: {
      $ref: getSchemaPath(HealthCheckDto)
    }
  })
  getData(): HealthCheckDto {
    return {
      status: 'ok',
      version: environment.app.version,
      uptime: Math.floor(process.uptime()),
      endpoints: {
        health: '/api',
        login: '/api/auth/login',
        stream: '/api/chat/stream',
        docs: '/docs',
        version: '/api/version'
      }
    };
  }

  @Get('version')
  @ApiOperation({
    summary: 'Get application version',
    description: 'Returns the current application version information'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Version information retrieved successfully',
    type: VersionDto,
    schema: {
      $ref: getSchemaPath(VersionDto)
    }
  })
  getVersion(): VersionDto {
    return {
      name: environment.app.name,
      version: environment.app.version,
      buildDate: process.env.BUILD_DATE || new Date().toISOString()
    };
  }
}

