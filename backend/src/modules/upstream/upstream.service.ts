import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IUpstreamAdapter } from './interfaces/upstream-adapter.interface';
import { GongXiAdapter } from './adapters/gongxi.adapter';
import { UpstreamException } from '../../common/exceptions/business.exception';

@Injectable()
export class UpstreamService implements OnModuleInit {
  private readonly logger = new Logger(UpstreamService.name);
  private adapters: Map<number, IUpstreamAdapter> = new Map();

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadAdapters();
  }

  /**
   * 从数据库加载所有活跃的上游源并创建适配器
   */
  async loadAdapters() {
    const sources = await this.prisma.upstreamSource.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { priority: 'desc' },
    });

    this.adapters.clear();
    for (const source of sources) {
      try {
        const adapter = this.createAdapter(source);
        this.adapters.set(source.id, adapter);
        this.logger.log(`Loaded upstream adapter: ${source.name} (${source.type})`);
      } catch (error) {
        this.logger.error(`Failed to load adapter for ${source.name}: ${error.message}`);
      }
    }
  }

  /**
   * 根据上游源创建适配器实例
   */
  private createAdapter(source: any): IUpstreamAdapter {
    switch (source.type) {
      case 'gongxi':
        return new GongXiAdapter(
          source.baseUrl,
          source.apiKey,
          source.config as Record<string, any>,
        );
      default:
        throw new Error(`Unknown upstream type: ${source.type}`);
    }
  }

  /**
   * 获取最优先的适配器
   */
  async getAdapter(upstreamId?: number): Promise<{ id: number; adapter: IUpstreamAdapter }> {
    if (upstreamId && this.adapters.has(upstreamId)) {
      const adapter = this.adapters.get(upstreamId);
      if (adapter) {
        return { id: upstreamId, adapter };
      }
    }

    // 获取优先级最高的活跃适配器
    const sources = await this.prisma.upstreamSource.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { priority: 'desc' },
    });

    for (const source of sources) {
      if (this.adapters.has(source.id)) {
        const adapter = this.adapters.get(source.id);
        if (adapter) {
          return { id: source.id, adapter };
        }
      }
    }

    throw new UpstreamException('没有可用的上游邮箱源');
  }

  /**
   * 获取指定上游源适配器
   */
  getAdapterById(upstreamId: number): IUpstreamAdapter | undefined {
    return this.adapters.get(upstreamId);
  }

  /**
   * 刷新适配器（当管理员修改了上游源配置后调用）
   */
  async refreshAdapters() {
    await this.loadAdapters();
  }

  /**
   * 健康检查所有上游源
   */
  async healthCheckAll(): Promise<{ id: number; name: string; healthy: boolean }[]> {
    const sources = await this.prisma.upstreamSource.findMany({
      where: { status: 'ACTIVE' },
    });

    const results: { id: number; name: string; healthy: boolean }[] = [];
    for (const source of sources) {
      const adapter = this.adapters.get(source.id);
      let healthy = false;
      if (adapter) {
        try {
          healthy = await adapter.healthCheck();
        } catch {
          healthy = false;
        }
      }
      results.push({ id: source.id, name: source.name, healthy });
    }
    return results;
  }
}
