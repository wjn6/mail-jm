import { IsString, IsOptional, IsNumber, IsIn, IsDateString, MinLength, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Key 名称' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '速率限制 (每分钟请求数)', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  rateLimit?: number;

  @ApiPropertyOptional({ description: '过期时间 (ISO 8601 格式)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateApiKeyDto {
  @ApiPropertyOptional({ description: 'Key 名称' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '速率限制' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  rateLimit?: number;

  @ApiPropertyOptional({ description: '状态', enum: ['ACTIVE', 'DISABLED'] })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'DISABLED'])
  status?: string;
}
