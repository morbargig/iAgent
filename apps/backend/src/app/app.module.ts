import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { AuthGuard } from './auth/auth.guard';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { MongoDBConnectionService } from './database/mongodb-connection.service';
import { Chat, ChatSchema, ChatMessage, ChatMessageSchema, ChatFilter, ChatFilterSchema } from './schemas/chat.schema';
import { env } from '../config/env';

const isDemoMode = env.DEMO_MODE;
const mongoUri = env.MONGO_URI;
const hasMongoUri = env.HAS_MONGO_URI;

// Base module configuration
const baseModuleConfig = {
  controllers: [AppController, ChatController],
  providers: [
    AppService,
    AuthService,
    AuthGuard,
    ChatService,
    JwtStrategy,
    JwtAuthGuard,
    MongoDBConnectionService
  ],
};

// MongoDB configuration for production mode
const mongoDbConfig = {
  imports: [
    PassportModule,
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const mode = isDemoMode ? 'DEMO' : 'PRODUCTION';
        console.log(`🚀 Configuring MongoDB connection (${mode} mode)...`);
        return {
          uri: mongoUri,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              console.log('✅ Mongoose connected to MongoDB');
            });
            connection.on('error', (error: Error) => {
              console.error('❌ Mongoose connection error:', error.message);
            });
            return connection;
          },
        };
      },
    }),
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: ChatFilter.name, schema: ChatFilterSchema }
    ])
  ],
  ...baseModuleConfig,
};

// Demo mode configuration (no MongoDB)
const demoConfig = {
  imports: [
    PassportModule,
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  ...baseModuleConfig,
};

@Module(hasMongoUri ? mongoDbConfig : demoConfig)
export class AppModule {
  constructor(
    // MongoDBConnectionService is injected to initialize the singleton

    private readonly _dbConnection: MongoDBConnectionService
  ) {
    this.logStartupInfo();
  }

  private logStartupInfo() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 iAgent Backend - Startup Configuration');
    console.log('='.repeat(60));

    const mode = isDemoMode ? 'DEMO' : 'PRODUCTION';
    console.log(`📌 Mode: ${mode}`);
    console.log(`🔌 MongoDB URI: ${hasMongoUri ? '✅ Configured' : '❌ Not configured'}`);

    if (!hasMongoUri) {
      const missingVar = isDemoMode ? 'MONGODB_URI_LOCAL' : 'MONGODB_URI';
      console.log(`⚠️  ${missingVar} not set - Running in MEMORY MODE`);
      console.log('📝 All chat data will be stored in memory and will not persist');
    }

    console.log('='.repeat(60) + '\n');
  }
}
