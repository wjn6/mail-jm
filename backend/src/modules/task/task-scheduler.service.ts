import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private notificationGateway: NotificationGateway,
  ) {}

  /**
   * 每5分钟扫描过期的 ACTIVE 任务
   * 使用批量更新 + 单独通知的方式提高性能
   */
  @Cron('*/5 * * * *')
  async handleExpiredTasks() {
    this.logger.debug('开始扫描过期任务...');

    // 先批量查出需要通知的用户信息
    const expiredTasks = await this.prisma.emailTask.findMany({
      where: {
        status: 'ACTIVE',
        expireAt: { lt: new Date() },
      },
      select: { id: true, userId: true, email: true },
      take: 1000, // 限制单次处理量，防止内存爆炸
    });

    if (expiredTasks.length === 0) {
      return;
    }

    this.logger.log(`发现 ${expiredTasks.length} 个过期任务`);

    // 批量更新状态（一条 SQL）
    const expiredIds = expiredTasks.map((t) => t.id);
    await this.prisma.emailTask.updateMany({
      where: { id: { in: expiredIds }, status: 'ACTIVE' },
      data: {
        status: 'EXPIRED',
        completedAt: new Date(),
      },
    });

    // 逐个发送通知（WebSocket 推送成本很低）
    for (const task of expiredTasks) {
      try {
        this.notificationGateway.notifyTaskUpdate(task.userId, {
          taskId: task.id,
          status: 'EXPIRED',
          email: task.email,
        });
      } catch (error) {
        this.logger.error(`通知用户 ${task.userId} 失败: ${(error as Error).message}`);
      }
    }

    this.logger.log(`已批量标记 ${expiredTasks.length} 个过期任务`);
  }

  /**
   * 每小时清理长时间未完成的冻结记录
   * 1. 标记超时的 ACTIVE 任务为 EXPIRED
   * 2. 尝试解冻 FAILED 状态任务残留的冻结金额
   */
  @Cron('0 * * * *')
  async handleStaleFreeze() {
    this.logger.debug('开始扫描异常冻结...');

    // 1. 标记超时 ACTIVE 任务为 EXPIRED
    const result = await this.prisma.emailTask.updateMany({
      where: {
        status: 'ACTIVE',
        expireAt: {
          lt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      },
      data: {
        status: 'EXPIRED',
        completedAt: new Date(),
      },
    });

    if (result.count > 0) {
      this.logger.warn(`已强制标记 ${result.count} 个异常任务为过期`);
    }

    // 2. 尝试解冻 FAILED 任务残留的冻结金额
    // 这些是 confirmDeduct 和 unfreeze 都失败后遗留的
    const failedTasksWithCost = await this.prisma.emailTask.findMany({
      where: {
        status: 'FAILED',
        cost: { gt: 0 },
        // 只处理最近24小时内创建、至少1小时前失败的任务
        completedAt: {
          lt: new Date(Date.now() - 60 * 60 * 1000),
          gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      select: { id: true, userId: true, cost: true },
      take: 100,
    });

    for (const task of failedTasksWithCost) {
      try {
        // 检查用户钱包是否仍有冻结余额，如果有则尝试解冻
        const wallet = await this.prisma.wallet.findUnique({
          where: { userId: task.userId },
          select: { frozenBalance: true },
        });

        if (wallet && Number(wallet.frozenBalance) > 0) {
          await this.walletService.unfreeze(
            task.userId,
            Number(task.cost),
            `定时清理：解冻失败任务 #${task.id} 的冻结金额`,
          );
          this.logger.log(`已解冻用户 ${task.userId} 的残留冻结 ¥${task.cost} (任务 #${task.id})`);
        }
      } catch (error) {
        this.logger.error(`解冻残留冻结失败: taskId=${task.id}, error=${(error as Error).message}`);
      }
    }
  }
}
