/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend communication
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:3000'], // Frontend ports
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'x-user-id'],
    credentials: true,
  });
  
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('ChatGPT Clone API')
    .setDescription('A modern ChatGPT-like API built with NestJS featuring streaming responses and real-time chat functionality')
    .setVersion('1.0')
    .setContact(
      'ChatGPT Clone Team',
      'https://github.com/your-repo/chatgpt-clone',
      'contact@chatgptclone.dev'
    )
    .addTag('Chat', 'Chat and messaging endpoints')
    .addTag('Authentication', 'Authentication endpoints')
    .addTag('Chat Management', 'Chat CRUD operations')
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://your-production-domain.com', 'Production server')
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
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'ChatGPT Clone API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #10a37f }
    `,
    customfavIcon: 'https://avatars.githubusercontent.com/u/6936373?s=200&v=4',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📚 API Documentation available at: http://localhost:${port}/${globalPrefix}/docs`
  );
  Logger.log(
    `🔄 Streaming endpoints available for real-time chat functionality`
  );
}

bootstrap();
