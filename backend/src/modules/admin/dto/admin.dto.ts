import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ===== 用户管理 =====

export class UpdateUserStatusDto {
  @ApiProperty({ description: '用户状态', enum: ['ACTIVE', 'DISABLED'] })
  @IsString()
  @IsIn(['ACTIVE', 'DISABLED'])
  status: string;
}

export class RechargeUserDto {
  @ApiProperty({ description: '充值金额', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

// ===== 上游管理 =====

export class CreateUpstreamDto {
  @ApiProperty({ description: '名称' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '类型', enum: ['gongxi', 'custom'] })
  @IsString()
  @IsIn(['gongxi', 'custom'])
  type: string;

  @ApiProperty({ description: '基础URL' })
  @IsString()
  @MaxLength(500)
  baseUrl: string;

  @ApiProperty({ description: 'API Key' })
  @IsString()
  @MaxLength(500)
  apiKey: string;

  @ApiPropertyOptional({ description: '优先级' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priority?: number;

  @ApiPropertyOptional({ description: '配置' })
  @IsOptional()
  config?: unknown;
}

export class UpdateUpstreamDto {
  @ApiPropertyOptional({ description: '名称' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '类型' })
  @IsOptional()
  @IsString()
  @IsIn(['gongxi', 'custom'])
  type?: string;

  @ApiPropertyOptional({ description: '基础URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  baseUrl?: string;

  @ApiPropertyOptional({ description: 'API Key' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiKey?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'DISABLED', 'ERROR'])
  status?: string;

  @ApiPropertyOptional({ description: '优先级' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priority?: number;

  @ApiPropertyOptional({ description: '配置' })
  @IsOptional()
  config?: unknown;
}

// ===== 计费规则 =====

export class CreatePricingRuleDto {
  @ApiProperty({ description: '规则名称' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '计费类型', enum: ['PER_USE', 'PACKAGE'] })
  @IsString()
  @IsIn(['PER_USE', 'PACKAGE'])
  type: string;

  @ApiProperty({ description: '价格', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '是否默认' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePricingRuleDto {
  @ApiPropertyOptional({ description: '规则名称' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '计费类型' })
  @IsOptional()
  @IsString()
  @IsIn(['PER_USE', 'PACKAGE'])
  type?: string;

  @ApiPropertyOptional({ description: '价格' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '是否默认' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'DISABLED'])
  status?: string;
}

// ===== 公告管理 =====

export class CreateAnnouncementDto {
  @ApiProperty({ description: '标题' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '内容' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({ description: '类型', enum: ['INFO', 'WARNING', 'IMPORTANT'] })
  @IsOptional()
  @IsString()
  @IsIn(['INFO', 'WARNING', 'IMPORTANT'])
  type?: string;

  @ApiPropertyOptional({ description: '是否置顶' })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({ description: '标题' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '内容' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '类型' })
  @IsOptional()
  @IsString()
  @IsIn(['INFO', 'WARNING', 'IMPORTANT'])
  type?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'DISABLED'])
  status?: string;

  @ApiPropertyOptional({ description: '是否置顶' })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}

// ===== 管理员管理 =====

export class CreateAdminDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @ApiPropertyOptional({ description: '角色', enum: ['ADMIN', 'SUPER_ADMIN'] })
  @IsOptional()
  @IsString()
  @IsIn(['ADMIN', 'SUPER_ADMIN'])
  role?: string;
}
