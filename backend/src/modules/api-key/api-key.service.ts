import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * 生成 API Key（使用 SHA-256 替代 bcrypt 以提高验证性能）
   */
  private generateApiKey(): { key: string; prefix: string } {
    const randomPart = crypto.randomBytes(24).toString('hex');
    const key = `sk_${randomPart}`;
    const prefix = key.substring(0, 10);
    return { key, prefix };
  }

  /**
   * 使用 SHA-256 对 API Key 进行哈希
   */
  private hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  async getApiKeys(userId: number, projectId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new BusinessException('PROJECT_NOT_FOUND', '项目不存在');
    }

    return this.prisma.apiKey.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        rateLimit: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApiKey(
    userId: number,
    projectId: number,
    data: { name: string; rateLimit?: number; expiresAt?: string },
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new BusinessException('PROJECT_NOT_FOUND', '项目不存在');
    }

    const count = await this.prisma.apiKey.count({ where: { projectId } });
    if (count >= 5) {
      throw new BusinessException('API_KEY_LIMIT', '每个项目最多创建 5 个 API Key');
    }

    const { key, prefix } = this.generateApiKey();
    const keyHash = this.hashApiKey(key);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        projectId,
        name: data.name,
        keyHash,
        keyPrefix: prefix,
        rateLimit: data.rateLimit || 60,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      key, // 仅创建时返回明文
      keyPrefix: prefix,
      rateLimit: apiKey.rateLimit,
      status: apiKey.status,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  async updateApiKey(
    userId: number,
    keyId: number,
    data: { name?: string; rateLimit?: number; status?: string },
  ) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id: keyId },
      include: { project: true },
    });

    if (!apiKey || apiKey.project.userId !== userId) {
      throw new BusinessException('API_KEY_NOT_FOUND', 'API Key 不存在');
    }

    const updated = await this.prisma.apiKey.update({
      where: { id: keyId },
      data,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        rateLimit: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // 清除缓存
    await this.invalidateCache(apiKey.keyHash);

    return updated;
  }

  async deleteApiKey(userId: number, keyId: number) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id: keyId },
      include: { project: true },
    });

    if (!apiKey || apiKey.project.userId !== userId) {
      throw new BusinessException('API_KEY_NOT_FOUND', 'API Key 不存在');
    }

    // 清除缓存
    await this.invalidateCache(apiKey.keyHash);

    await this.prisma.apiKey.delete({ where: { id: keyId } });
    return { message: 'API Key 已删除' };
  }

  /**
   * 验证 API Key - 使用 SHA-256 + Redis 缓存
   */
  async validateApiKey(key: string): Promise<{
    apiKeyId: number;
    userId: number;
    projectId: number;
    rateLimit: number;
  } | null> {
    const keyHash = this.hashApiKey(key);

    // 先从 Redis 缓存查找
    const cacheKey = `api_key_info:${keyHash}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const info = JSON.parse(cached);
      if (info === null) return null; // 缓存了"不存在"的结果
      return info;
    }

    // SHA-256 是确定性哈希，可以直接用哈希值查找
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { keyHash, status: 'ACTIVE' },
      include: { project: { include: { user: true } } },
    });

    if (!apiKey) {
      // 缓存"不存在"的结果，防止暴力破解频繁查库（短 TTL）
      await this.redis.set(cacheKey, 'null', 60);
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      await this.redis.set(cacheKey, 'null', 60);
      return null;
    }

    if (apiKey.project.user.status !== 'ACTIVE') {
      await this.redis.set(cacheKey, 'null', 60);
      return null;
    }

    const result = {
      apiKeyId: apiKey.id,
      userId: apiKey.project.userId,
      projectId: apiKey.projectId,
      rateLimit: apiKey.rateLimit,
    };

    // 缓存有效结果 5 分钟
    await this.redis.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  /**
   * 清除 API Key 缓存
   */
  private async invalidateCache(keyHash: string): Promise<void> {
    const cacheKey = `api_key_info:${keyHash}`;
    await this.redis.del(cacheKey);
  }

  async checkRateLimit(apiKeyId: number, rateLimit: number): Promise<boolean> {
    return this.redis.checkRateLimit(`api_key:${apiKeyId}`, rateLimit, 60);
  }
}
