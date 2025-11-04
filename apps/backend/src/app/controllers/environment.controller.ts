import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { environment } from '../../environments/environment';

@ApiTags('Environment')
@Controller('environment')
export class EnvironmentController {
  @Get()
  @ApiOperation({ 
    summary: 'Get environment configuration',
    description: 'Returns the current environment configuration (excluding sensitive data)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Environment configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        production: { type: 'boolean' },
        apiUrl: { type: 'string' },
        frontendUrl: { type: 'string' },
        swagger: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            title: { type: 'string' },
            description: { type: 'string' },
            version: { type: 'string' }
          }
        },
        logging: {
          type: 'object',
          properties: {
            level: { type: 'string' },
            enableConsole: { type: 'boolean' },
            enableFile: { type: 'boolean' }
          }
        },
        features: {
          type: 'object',
          properties: {
            enableSwagger: { type: 'boolean' },
            enableCors: { type: 'boolean' },
            enableRateLimit: { type: 'boolean' },
            enableHelmet: { type: 'boolean' }
          }
        },
        cors: {
          type: 'object',
          properties: {
            origins: { type: 'array', items: { type: 'string' } },
            methods: { type: 'array', items: { type: 'string' } },
            allowedHeaders: { type: 'array', items: { type: 'string' } },
            credentials: { type: 'boolean' }
          }
        },
        mongodb: {
          type: 'object',
          properties: {
            dbName: { type: 'string' },
            configured: { type: 'boolean' }
          }
        },
        fileUpload: {
          type: 'object',
          properties: {
            maxFileSize: { type: 'number' },
            maxTotalSize: { type: 'number' },
            maxFileCount: { type: 'number' },
            acceptedTypes: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  })
  getEnvironment() {
    // Return environment config without sensitive data
    return {
      production: environment.production,
      apiUrl: environment.apiUrl,
      frontendUrl: environment.frontendUrl,
      swagger: environment.swagger,
      logging: environment.logging,
      features: environment.features,
      cors: environment.cors,
      mongodb: {
        // Only return database name, NOT the connection URI (contains credentials)
        dbName: environment.mongodb.dbName,
        // Indicate if MongoDB is configured without exposing the URI
        configured: !!environment.mongodb.uri
      },
      fileUpload: {
        maxFileSize: environment.fileUpload.maxFileSize,
        maxTotalSize: environment.fileUpload.maxTotalSize,
        maxFileCount: environment.fileUpload.maxFileCount,
        acceptedTypes: environment.fileUpload.acceptedTypes
      },
      // Exclude sensitive data:
      // - JWT secrets (environment.jwt.secret)
      // - MongoDB URI with credentials (environment.mongodb.uri)
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'development'
    };
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Returns basic health information about the application'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Health check successful',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        environment: { type: 'string' },
        timestamp: { type: 'string' },
        uptime: { type: 'number' }
      }
    }
  })
  getHealth() {
    return {
      status: 'healthy',
      environment: environment.production ? 'production' : 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}
