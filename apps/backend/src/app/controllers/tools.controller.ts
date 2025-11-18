import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Tools')
@Controller('tools')
export class ToolsController {
  @Get('pages')
  @ApiOperation({
    summary: 'Get page options for tools',
    description: 'Returns available page options for tool configuration'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page options retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string', example: 'news' },
          label: { type: 'string', example: 'News Articles' }
        }
      }
    }
  })
  getPageOptions() {
    return [
      { value: 'news', label: 'News Articles' },
      { value: 'academic', label: 'Academic Papers' },
      { value: 'blogs', label: 'Blog Posts' },
      { value: 'forums', label: 'Discussion Forums' },
      { value: 'wiki', label: 'Wikipedia' },
      { value: 'government', label: 'Government Sites' },
      { value: 'social', label: 'Social Media' },
      { value: 'commercial', label: 'Commercial Sites' },
    ];
  }
}

