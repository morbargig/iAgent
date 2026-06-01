import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { AuthGuard } from './auth/auth.guard';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthController } from './controllers/auth.controller';
import { ToolsController } from './controllers/tools.controller';
import { CountriesController } from './controllers/countries.controller';
import { StreamingController } from './controllers/streaming.controller';
import { ChatController } from './controllers/chat.controller';
import { EnvironmentController } from './controllers/environment.controller';
import { FileController } from './controllers/file.controller';
import { DatabaseController } from './controllers/database.controller';
import { ChatService } from './services/chat.service';
import { FileService } from './services/file.service';
import { Chat, ChatSchema, ChatMessage, ChatMessageSchema, ChatFilter, ChatFilterSchema } from './schemas/chat.schema';
import { environment } from '../environments/environment';

@Module({
  imports: [
    HttpModule,
    PassportModule,
    JwtModule.register({
      secret: environment.jwt.secret,
      signOptions: { expiresIn: environment.jwt.expiresIn },
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
  controllers: [
    AppController,
    AuthController,
    ToolsController,
    CountriesController,
    StreamingController,
    ChatController,
    EnvironmentController,
    FileController,
    DatabaseController
  ],
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
