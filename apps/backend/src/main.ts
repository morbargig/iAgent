/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module.js';
import { environment } from './environments/environment';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Enable CORS for frontend communication
    if (environment.features.enableCors) {
      const isOriginAllowed = (origin: string | undefined, allowedOrigins: (string | RegExp)[]): boolean => {
        // Allow undefined origin (same-origin requests, e.g., Swagger UI)
        if (!origin) {
          return true;
        }
        return allowedOrigins.some((allowedOrigin) => {
          if (typeof allowedOrigin === 'string') {
            return origin === allowedOrigin;
          }
          if (allowedOrigin instanceof RegExp) {
            return allowedOrigin.test(origin);
          }
          return false;
        });
      };
      app.enableCors({
        origin: (requestOrigin, callback) => {
          if (isOriginAllowed(requestOrigin || undefined, environment.cors.origins)) {
            callback(null, true);
          } else {
            callback(new Error(`Not allowed by CORS: ${requestOrigin}`));
          }
        },
        methods: environment.cors.methods,
        allowedHeaders: environment.cors.allowedHeaders,
        credentials: environment.cors.credentials,
      });
    }

    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    // Swagger configuration (before global prefix to avoid routing conflicts)
    if (environment.features.enableSwagger) {
      // Use serverUrl from environment configuration
      let baseUrl = environment.swagger.serverUrl;

      // Fallback if serverUrl is not set
      if (!baseUrl) {
        if (environment.production) {
          baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.API_URL || `https://iagent-1-jzyj.onrender.com`;
        } else {
          baseUrl = `http://localhost:${environment.port}`;
        }
      }

      // Ensure HTTPS in production
      if (environment.production && baseUrl.startsWith('http://')) {
        baseUrl = baseUrl.replace('http://', 'https://');
      }

      // Log the Swagger base URL for debugging
      Logger.log(`📚 Swagger API Base URL: ${baseUrl}`);

      const configBuilder = new DocumentBuilder()
        .setTitle(environment.swagger.title)
        .setVersion(environment.swagger.version);
      
      if (environment.swagger.contact) {
        configBuilder.setContact(
          environment.swagger.contact.name,
          environment.swagger.contact.url || '',
          environment.swagger.contact.email || ''
        );
      }
      
      const config = configBuilder
        .addTag('Chat', 'Chat and messaging endpoints')
        .addTag('Authentication', 'Authentication endpoints')
        .addTag('Chat Management', 'Chat CRUD operations')
        .addTag('Environment', 'Environment configuration endpoints')
        .addTag('Files', 'File upload/download endpoints')
        .addServer(baseUrl, environment.production ? 'Production' : 'Development')
        .setExternalDoc(
          'Agent API Documentation',
          `${environment.agentApi.url}/docs`
        )
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter JWT token',
            in: 'header',
          },
          'JWT-auth',
        )
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document, {
        customSiteTitle: `${environment.swagger.title} Documentation`,
        customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #10a37f }
      `,
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          deepLinking: true,
        },
      });
    }

    // Redirect '/' to '/api' to avoid "Cannot GET /"
    const httpAdapter = app.getHttpAdapter();
    if (httpAdapter && typeof (httpAdapter as any).get === 'function') {
      (httpAdapter as any).get('/', (_req: any, res: any) => {
        res.redirect('/api');
      });
    }

    await app.listen(environment.port, environment.host);

    const displayHost = environment.host === '0.0.0.0' ? '0.0.0.0 (all interfaces)' : environment.host;
    Logger.log(
      `🚀 Application is running on: http://${environment.host}:${environment.port}/${globalPrefix}`
    );
    Logger.log(
      `🌍 Environment: ${environment.production ? 'Production' : 'Development'} | Host: ${displayHost}`
    );
    if (environment.features.enableSwagger) {
      const swaggerHost = environment.host === '0.0.0.0' ? 'localhost' : environment.host;
      Logger.log(
        `📚 API Documentation available at: http://${swaggerHost}:${environment.port}/docs`
      );
    }
    Logger.log(
      `🔄 Streaming endpoints available for real-time chat functionality`
    );
  } catch (error) {
    Logger.error('❌ Failed to start application:', error);
    Logger.error('💡 Make sure MONGODB_URI and JWT_SECRET are set in your environment variables');
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error during bootstrap:', error);
  process.exit(1);
});
