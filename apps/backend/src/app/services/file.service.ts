import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { GridFSBucket, GridFSBucketWriteStream, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import { createHash } from 'crypto';
import { environment } from '../../environments/environment';

export interface FileUploadResult {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadDate: Date;
}

export interface FileInfo {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadDate: Date;
  metadata?: any;
}

@Injectable()
export class FileService {
  private gridFSBucket: GridFSBucket;
  private readonly logger = new Logger(FileService.name);

  constructor(@InjectConnection() private connection: Connection) {
    if (!this.connection.db) {
      throw new Error('Database connection not available');
    }
    this.gridFSBucket = new GridFSBucket(this.connection.db, {
      bucketName: 'fs'
    });
  }

  /**
   * Validate file against environment limits
   */
  // @ts-ignore
  private validateFile(file: Express.Multer.File): void {
    const { maxFileSize, acceptedTypes } = environment.fileUpload;

    // Check file size
    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File size (${this.formatBytes(file.size)}) exceeds maximum allowed size (${this.formatBytes(maxFileSize)})`
      );
    }

    // Check file type if restrictions exist
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Accepted types: ${acceptedTypes.join(', ')}`
      );
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  async uploadFile(
    // @ts-ignore
    file: Express.Multer.File,
    metadata?: any
  ): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file against environment limits
    this.validateFile(file);

    // Compute SHA-256 hash of file contents for deduplication
    const hash = createHash('sha256').update(file.buffer).digest('hex');

    // Enhanced deduplication: Check if a file with BOTH same content hash AND filename exists
    // This prevents deduplication when users intentionally rename files with same content
    const existing = await this.gridFSBucket
      .find({
        'metadata.hash': hash,
        'filename': file.originalname  // Must match filename too!
      })
      .limit(1)
      .toArray();

    if (existing.length > 0) {
      const dup = existing[0] as any;
      this.logger.log(`File already exists with same content and filename: ${file.originalname}`);
      return {
        id: dup._id.toString(),
        filename: dup.filename,
        size: dup.length,
        mimetype: dup.metadata?.mimetype || 'application/octet-stream',
        uploadDate: dup.uploadDate,
      };
    }

    const uploadStream: GridFSBucketWriteStream = this.gridFSBucket.openUploadStream(
      file.originalname,
      {
        metadata: {
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          hash,
          uploadedAt: new Date(),
          chatId: metadata?.chatId, // Support chat association
          userId: metadata?.userId, // Support user association
          ...metadata
        }
      }
    );

    this.logger.log(`Uploading new file: ${file.originalname} (${this.formatBytes(file.size)})`);


    return new Promise((resolve, reject) => {
      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);

      readable.pipe(uploadStream);

      uploadStream.on('error', (error) => {
        reject(new BadRequestException(`Upload failed: ${error.message}`));
      });

      uploadStream.on('finish', () => {
        resolve({
          id: uploadStream.id.toString(),
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadDate: new Date()
        });
      });
    });
  }

  async getFileStream(fileId: string): Promise<{ stream: Readable; fileInfo: FileInfo }> {
    try {
      const objectId = new ObjectId(fileId);
      const fileInfo = await this.getFileInfo(fileId);

      const downloadStream = this.gridFSBucket.openDownloadStream(objectId);

      return {
        stream: downloadStream,
        fileInfo
      };
    } catch (error) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }
  }

  async getFileInfo(fileId: string): Promise<FileInfo> {
    try {
      const objectId = new ObjectId(fileId);
      const files = await this.gridFSBucket.find({ _id: objectId }).toArray();

      if (files.length === 0) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }

      const file = files[0];
      return {
        id: file._id.toString(),
        filename: file.filename,
        size: file.length,
        mimetype: file.metadata?.mimetype || 'application/octet-stream',
        uploadDate: file.uploadDate,
        metadata: file.metadata
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }
  }

  async listFiles(limit = 50, skip = 0, query?: string): Promise<FileInfo[]> {
    // Build MongoDB query filter
    const filter: any = {};

    // Add filename search filter if query is provided
    if (query && query.trim()) {
      filter.filename = {
        $regex: query.trim(),
        $options: 'i' // Case-insensitive search
      };
    }

    const files = await this.gridFSBucket
      .find(filter)
      .sort({ uploadDate: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    return files.map(file => ({
      id: file._id.toString(),
      filename: file.filename,
      size: file.length,
      mimetype: file.metadata?.mimetype || 'application/octet-stream',
      uploadDate: file.uploadDate,
      metadata: file.metadata
    }));
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const objectId = new ObjectId(fileId);
      await this.gridFSBucket.delete(objectId);
    } catch (error) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }
  }

  async getFileCount(query?: string): Promise<number> {
    // Build MongoDB query filter (same as in listFiles)
    const filter: any = {};

    // Add filename search filter if query is provided
    if (query && query.trim()) {
      filter.filename = {
        $regex: query.trim(),
        $options: 'i' // Case-insensitive search
      };
    }

    const files = await this.gridFSBucket.find(filter).toArray();
    return files.length;
  }

  /**
   * Get files associated with a specific chat
   */
  async getFilesByChatId(chatId: string): Promise<FileInfo[]> {
    const files = await this.gridFSBucket
      .find({ 'metadata.chatId': chatId })
      .sort({ uploadDate: -1 })
      .toArray();

    return files.map(file => ({
      id: file._id.toString(),
      filename: file.filename,
      size: file.length,
      mimetype: file.metadata?.mimetype || 'application/octet-stream',
      uploadDate: file.uploadDate,
      metadata: file.metadata
    }));
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    // @ts-ignore
    files: Express.Multer.File[],
    metadata?: any
  ): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, metadata);
      results.push(result);
    }

    return results;
  }
}
