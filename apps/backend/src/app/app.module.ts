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
import { Chat, ChatSchema, ChatMessage, ChatMessageSchema } from './schemas/chat.schema';

const isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.MONGODB_URI;

// Base module configuration
const baseModuleConfig = {
  controllers: [AppController, ChatController],
  providers: [AppService, AuthService, AuthGuard, ChatService, JwtStrategy, JwtAuthGuard],
};

// MongoDB configuration for production mode
const mongoDbConfig = {
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'demo-secret-key-for-development',
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        console.log('🚀 Connecting to MongoDB...');
        return {
          uri: process.env.MONGODB_URI,
        };
      },
    }),
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema }
    ])
  ],
  ...baseModuleConfig,
};

// Demo mode configuration (no MongoDB)
const demoConfig = {
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'demo-secret-key-for-development',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  ...baseModuleConfig,
};

@Module(isDemoMode ? demoConfig : mongoDbConfig)
export class AppModule {
  constructor() {
    if (isDemoMode) {
      console.log('🚨 Demo Mode Enabled: MongoDB connection completely disabled');
      console.log('📝 All chat data will be stored in memory and will not persist');
    } else {
      console.log('🚀 Production Mode: MongoDB connection enabled');
    }
  }
}
