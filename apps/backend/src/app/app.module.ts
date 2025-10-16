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
import { EnvironmentController } from './controllers/environment.controller';
import { FileController } from './controllers/file.controller';
import { ChatService } from './services/chat.service';
import { FileService } from './services/file.service';
import { Chat, ChatSchema, ChatMessage, ChatMessageSchema, ChatFilter, ChatFilterSchema } from './schemas/chat.schema';
import { environment } from '../environments/environment';

const isDemoMode = environment.demoMode || !environment.mongodb.activeUri;

// Base module configuration
const baseModuleConfig = {
  controllers: [AppController, ChatController, EnvironmentController, FileController],
  providers: [AppService, AuthService, AuthGuard, ChatService, FileService, JwtStrategy, JwtAuthGuard],
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
        const uri = environment.mongodb.activeUri;
        const mode = environment.demoMode ? 'LOCAL' : 'REMOTE';
        console.log(`🚀 Connecting to MongoDB (${mode})...`);
        console.log(`📁 Database: ${environment.mongodb.dbName}`);
        return {
          uri,
          dbName: environment.mongodb.dbName,
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
      console.log('📝 All data will be stored in memory and will not persist');
    } else {
      const mode = environment.demoMode ? 'Local MongoDB (Docker)' : 'Remote MongoDB';
      console.log(`🚀 Production Mode: ${mode} connection enabled`);
    }
    
    // Log file upload limits
    console.log('📤 File Upload Limits:');
    console.log(`   - Max file size: ${(environment.fileUpload.maxFileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Max total size: ${(environment.fileUpload.maxTotalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Max file count: ${environment.fileUpload.maxFileCount}`);
  }
}
