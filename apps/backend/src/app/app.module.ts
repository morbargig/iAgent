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
import { FileController } from './controllers/file.controller';
import { ChatService } from './services/chat.service';
import { FileService } from './services/file.service';
import { Chat, ChatSchema, ChatMessage, ChatMessageSchema, ChatFilter, ChatFilterSchema } from './schemas/chat.schema';
import { environment } from '../environments/environment';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'demo-secret-key-for-development',
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri = environment.mongodb.uri;
        console.log(`🚀 Connecting to MongoDB...`);
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
  controllers: [AppController, ChatController, FileController],
  providers: [AppService, AuthService, AuthGuard, ChatService, FileService, JwtStrategy, JwtAuthGuard],
})
export class AppModule {
  constructor() {
    console.log('🚀 MongoDB connection enabled');
    
    // Log file upload limits
    console.log('📤 File Upload Limits:');
    console.log(`   - Max file size: ${(environment.fileUpload.maxFileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Max total size: ${(environment.fileUpload.maxTotalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Max file count: ${environment.fileUpload.maxFileCount}`);
  }
}
