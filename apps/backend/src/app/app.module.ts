import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { AuthGuard } from './auth/auth.guard';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, AuthService, AuthGuard],
})
export class AppModule {}
