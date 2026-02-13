import { IsOptional, IsString, IsInt, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetEmailDto {
  @ApiPropertyOptional({ description: '项目ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  projectId?: number;

  @ApiPropertyOptional({ description: '上游分组' })
  @IsOptional()
  @IsString()
  group?: string;
}

export class GetCodeDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ description: '正则匹配模式', example: '\\d{6}' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  match?: string;
}

export class CheckMailDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ description: '邮箱文件夹', default: 'inbox' })
  @IsOptional()
  @IsString()
  mailbox?: string;
}

export class ReleaseEmailDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsString()
  email: string;
}
