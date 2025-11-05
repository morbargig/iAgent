// TODO: add types in general in this file.
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { Express } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { FileService, FileUploadResult, FileInfo } from '../services/file.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../decorators/user.decorator';

@ApiTags('Files')
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a file',
    description: 'Upload a file to MongoDB GridFS storage',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        filename: { type: 'string' },
        size: { type: 'number' },
        mimetype: { type: 'string' },
        uploadDate: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - no file provided' })
  async uploadFile(
    // @ts-expect-error - Multer file type
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.fileService.uploadFile(file);
  }

  @Get('list')
  @ApiOperation({
    summary: 'List uploaded files',
    description: 'Get a list of all uploaded files with pagination and optional search',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of files to return (default: 50)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of files to skip (default: 0)' })
  @ApiQuery({ name: 'query', required: false, type: String, description: 'Search query to filter files by filename' })
  @ApiResponse({
    status: 200,
    description: 'List of files retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          filename: { type: 'string' },
          size: { type: 'number' },
          mimetype: { type: 'string' },
          uploadDate: { type: 'string', format: 'date-time' },
          metadata: { type: 'object' },
        },
      },
    },
  })
  async listFiles(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('query') query?: string,
  ): Promise<FileInfo[]> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const skipNum = skip ? parseInt(skip, 10) : 0;

    if (limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    if (skipNum < 0) {
      throw new BadRequestException('Skip must be 0 or greater');
    }

    return this.fileService.listFiles(limitNum, skipNum, query);
  }

  @Get('count')
  @ApiOperation({
    summary: 'Get file count',
    description: 'Get the total number of uploaded files, optionally filtered by search query',
  })
  @ApiQuery({ name: 'query', required: false, type: String, description: 'Search query to filter files by filename' })
  @ApiResponse({
    status: 200,
    description: 'File count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    },
  })
  async getFileCount(@Query('query') query?: string): Promise<{ count: number }> {
    const count = await this.fileService.getFileCount(query);
    return { count };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Download a file',
    description: 'Download a file by its ID',
  })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { stream, fileInfo } = await this.fileService.getFileStream(id);

      res.set({
        'Content-Type': fileInfo.mimetype,
        'Content-Disposition': `attachment; filename="${fileInfo.filename}"`,
        'Content-Length': fileInfo.size.toString(),
      });

      stream.pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`File with ID ${id} not found`);
    }
  }


  @Get(':id/info')
  @ApiOperation({
    summary: 'Get file information',
    description: 'Get metadata information about a file without downloading it',
  })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({
    status: 200,
    description: 'File information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        filename: { type: 'string' },
        size: { type: 'number' },
        mimetype: { type: 'string' },
        uploadDate: { type: 'string', format: 'date-time' },
        metadata: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFileInfo(@Param('id') id: string): Promise<FileInfo> {
    return this.fileService.getFileInfo(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a file',
    description: 'Delete a file by its ID',
  })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Param('id') id: string): Promise<{ message: string }> {
    await this.fileService.deleteFile(id);
    return { message: 'File deleted successfully' };
  }

  // ==================== CHAT-ATTACHED FILE ENDPOINTS ====================

  // TODO: add message id
  @Post('chat/:chatId/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files per request
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Upload files to a chat',
    description: 'Upload one or multiple files associated with a chat. Requires authentication.',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID to associate files with' })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          filename: { type: 'string' },
          size: { type: 'number' },
          mimetype: { type: 'string' },
          uploadDate: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No files provided or invalid file data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadChatFiles(
    @Param('chatId') chatId: string,
    @UserId() userId: string,
    // @ts-expect-error - Multer files type
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<FileUploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const metadata = {
      chatId,
      userId,
      uploadedAt: new Date(),
    };

    return await this.fileService.uploadFiles(files, metadata);
  }

  @Get('chat/:chatId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get files for a chat',
    description: 'Retrieve all files associated with a specific chat. Requires authentication.',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          filename: { type: 'string' },
          size: { type: 'number' },
          mimetype: { type: 'string' },
          uploadDate: { type: 'string', format: 'date-time' },
          metadata: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getChatFiles(@Param('chatId') chatId: string): Promise<FileInfo[]> {
    return await this.fileService.getFilesByChatId(chatId);
  }
}
