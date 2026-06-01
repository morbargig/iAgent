import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckDto {
  @ApiProperty({ description: 'Service status', example: 'ok' })
  status!: string;

  @ApiProperty({ description: 'Application version', example: '1.0.0' })
  version!: string;

  @ApiProperty({
    description: 'Build timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  buildDate!: string;

  @ApiProperty({ description: 'Uptime in seconds', example: 3600 })
  uptime!: number;
}

export class VersionDto {
  @ApiProperty({ description: 'Application name', example: 'iAgent Agent API' })
  name!: string;

  @ApiProperty({ description: 'Application version', example: '1.0.0' })
  version!: string;

  @ApiProperty({
    description: 'Build timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  buildDate!: string;
}
