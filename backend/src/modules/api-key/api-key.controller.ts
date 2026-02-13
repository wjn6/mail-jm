import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto/api-key.dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('API Key 管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user/projects/:projectId/api-keys')
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Get()
  getApiKeys(
    @CurrentUser('id') userId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.apiKeyService.getApiKeys(userId, projectId);
  }

  @Post()
  createApiKey(
    @CurrentUser('id') userId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeyService.createApiKey(userId, projectId, dto);
  }

  @Put(':keyId')
  updateApiKey(
    @CurrentUser('id') userId: number,
    @Param('keyId', ParseIntPipe) keyId: number,
    @Body() dto: UpdateApiKeyDto,
  ) {
    return this.apiKeyService.updateApiKey(userId, keyId, dto);
  }

  @Delete(':keyId')
  deleteApiKey(
    @CurrentUser('id') userId: number,
    @Param('keyId', ParseIntPipe) keyId: number,
  ) {
    return this.apiKeyService.deleteApiKey(userId, keyId);
  }
}
