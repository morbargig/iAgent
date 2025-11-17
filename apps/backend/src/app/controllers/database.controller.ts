import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { environment } from '../../environments/environment';

@ApiTags('Database Management')
@Controller('database')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DatabaseController {
  private readonly logger = new Logger(DatabaseController.name);

  constructor(@InjectConnection() private connection: Connection) {}

  @Delete('collections')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete all collections from the database',
    description: '⚠️ DANGER: This will delete ALL collections in the database. Only available in non-production environments.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All collections deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        deletedCollections: { type: 'array', items: { type: 'string' } },
        message: { type: 'string' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'This operation is disabled in production',
  })
  async deleteAllCollections() {
    if (environment.production) {
      this.logger.warn('❌ Attempted to delete all collections in production - BLOCKED');
      throw new ForbiddenException(
        'This operation is disabled in production environment'
      );
    }

    try {
      const db = this.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }

      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map((col) => col.name);
      const deletedCollections: string[] = [];

      this.logger.warn(`⚠️  Starting deletion of ${collectionNames.length} collections...`);

      for (const collectionName of collectionNames) {
        try {
          await db.collection(collectionName).drop();
          deletedCollections.push(collectionName);
          this.logger.log(`✅ Deleted collection: ${collectionName}`);
        } catch (error) {
          this.logger.error(`Failed to delete collection ${collectionName}:`, error);
        }
      }

      this.logger.warn(`⚠️  Deleted ${deletedCollections.length} collections`);

      return {
        success: true,
        deletedCollections,
        message: `Successfully deleted ${deletedCollections.length} collection(s)`,
      };
    } catch (error) {
      this.logger.error('Failed to delete collections:', error);
      throw error;
    }
  }
}

