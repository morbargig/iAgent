/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module.js';
import { environment } from './environments/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  if (environment.features.enableCors) {
    app.enableCors({
      origin: environment.cors.origins,
      methods: environment.cors.methods,
      allowedHeaders: environment.cors.allowedHeaders,
      credentials: environment.cors.credentials,
    });
  }

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Swagger configuration
  if (environment.features.enableSwagger) {
    // Use serverUrl from environment configuration
    let baseUrl = environment.swagger.serverUrl;
    
    // Fallback if serverUrl is not set
    if (!baseUrl) {
      const port = process.env.PORT || 3030;
      if (environment.production) {
        baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.API_URL || `https://iagent-1-jzyj.onrender.com`;
      } else {
        baseUrl = `http://localhost:${port}`;
      }
    }
    
    // Ensure HTTPS in production
    if (environment.production && baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.replace('http://', 'https://');
    }
    
    // Log the Swagger base URL for debugging
    Logger.log(`📚 Swagger API Base URL: ${baseUrl}`);
    
    const config = new DocumentBuilder()
      .setTitle(environment.swagger.title)
      .setVersion(environment.swagger.version)
      .setContact(
        'iAgent',
        'https://morbargig.github.io/iAgent/', // Website URL
        'morbargig@gmail.com' 
      )
      .addTag('Chat', 'Chat and messaging endpoints')
      .addTag('Authentication', 'Authentication endpoints')
      .addTag('Chat Management', 'Chat CRUD operations')
      .addTag('Environment', 'Environment configuration endpoints')
      .addTag('Files', 'File upload/download endpoints')
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
        'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: `${environment.swagger.title} Documentation`,
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #10a37f }
      `,
      customfavIcon: 'https://avatars.githubusercontent.com/u/6936373?s=200&v=4',
      swaggerOptions: {
        // Preserve the selected server in the UI
        persistAuthorization: true,
        // Show the base server URL properly
        displayRequestDuration: true,
        // Enable deep linking
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

  const port = process.env.PORT || 3030;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `🌍 Environment: ${environment.production ? 'Production' : 'Development'}`
  );
  if (environment.features.enableSwagger) {
    Logger.log(
      `📚 API Documentation available at: http://localhost:${port}/docs`
    );
  }
  Logger.log(
    `🔄 Streaming endpoints available for real-time chat functionality`
  );
}

bootstrap();
