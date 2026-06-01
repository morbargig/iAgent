import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { environment } from '../environments/environment';
import { HealthCheckDto, VersionDto } from './dto/health.dto';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
    type: HealthCheckDto,
    schema: { $ref: getSchemaPath(HealthCheckDto) },
  })
  getHealth(): HealthCheckDto {
    return {
      status: 'ok',
      version: environment.app.version,
      buildDate: environment.build.date,
      uptime: Math.floor(process.uptime()),
    };
  }

  @Get('version')
  @ApiOperation({ summary: 'Get application version' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Version information retrieved successfully',
    type: VersionDto,
    schema: { $ref: getSchemaPath(VersionDto) },
  })
  getVersion(): VersionDto {
    return {
      name: environment.app.name,
      version: environment.app.version,
      buildDate: environment.build.date,
    };
  }
}
