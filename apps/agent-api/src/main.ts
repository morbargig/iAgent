import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    if (environment.features.enableCors) {
      const isOriginAllowed = (origin: string | undefined, allowedOrigins: (string | RegExp)[]): boolean => {
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

    if (environment.features.enableSwagger) {
      let baseUrl = environment.swagger.serverUrl;

      if (!baseUrl) {
        if (environment.production) {
          baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.API_URL || `https://iagent-api.onrender.com`;
        } else {
          baseUrl = `http://localhost:${environment.port}`;
        }
      }

      if (environment.production && baseUrl.startsWith('http://')) {
        baseUrl = baseUrl.replace('http://', 'https://');
      }

      Logger.log(`📚 Swagger API Base URL: ${baseUrl}`);

      const configBuilder = new DocumentBuilder()
        .setTitle(environment.swagger.title)
        .setDescription(environment.swagger.description)
        .setVersion(environment.swagger.version);
      
      if (environment.swagger.contact) {
        configBuilder.setContact(
          environment.swagger.contact.name,
          environment.swagger.contact.url || '',
          environment.swagger.contact.email || ''
        );
      }
      
      const config = configBuilder
        .addTag('Agent API', 'Streaming and mock generation endpoints')
        .addServer(baseUrl, environment.production ? 'Production' : 'Development')
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

    const httpAdapter = app.getHttpAdapter();
    if (httpAdapter && typeof (httpAdapter as unknown as { get?: unknown }).get === 'function') {
      (httpAdapter as unknown as { get: (path: string, handler: (req: unknown, res: { redirect: (path: string) => void }) => void) => void }).get('/', (_req: unknown, res: { redirect: (path: string) => void }) => {
        res.redirect('/api');
      });
    }

    await app.listen(environment.port, environment.host);

    const displayHost = environment.host === '0.0.0.0' ? '0.0.0.0 (all interfaces)' : environment.host;
    Logger.log(
      `🚀 Agent API is running on: http://${environment.host}:${environment.port}/${globalPrefix}`
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
    Logger.error('❌ Failed to start agent-api:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error during bootstrap:', error);
  process.exit(1);
});
