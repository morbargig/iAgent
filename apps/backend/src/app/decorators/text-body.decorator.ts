import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Request } from 'express';

export const TextBody = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<string> => {
    const request = ctx.switchToHttp().getRequest<Request>();
    
    if (request.headers['content-type'] !== 'text/plain') {
      throw new BadRequestException('Content-Type must be text/plain');
    }

    return new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      request.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        
        const totalSize = chunks.reduce((sum, c) => sum + c.length, 0);
        if (totalSize > 10 * 1024 * 1024) {
          request.destroy();
          reject(new BadRequestException('Content exceeds 10MB limit'));
        }
      });

      request.on('end', () => {
        const contentBuffer = Buffer.concat(chunks);
        
        if (contentBuffer.length === 0) {
          reject(new BadRequestException('Content cannot be empty'));
          return;
        }

        resolve(contentBuffer.toString('utf-8'));
      });

      request.on('error', (error: Error) => {
        reject(new BadRequestException(`Failed to read request body: ${error.message}`));
      });
    });
  },
);

