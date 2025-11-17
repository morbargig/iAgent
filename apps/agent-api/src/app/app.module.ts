import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MockGenerationService } from './services/mock-generation.service';
import { StreamingService } from './services/streaming.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, MockGenerationService, StreamingService],
})
export class AppModule {}
