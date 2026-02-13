import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpstreamService } from '../upstream/upstream.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationGateway } from '../notification/notification.gateway';
import {
  BusinessException,
} from '../../common/exceptions/business.exception';
import { PaginatedResponse } from '../../common/dto';
import { GetEmailDto, GetCodeDto, CheckMailDto, ReleaseEmailDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private prisma: PrismaService,
    private upstreamService: UpstreamService,
    private walletService: WalletService,
    private notificationGateway: NotificationGateway,
  ) {}

  /**
   * 获取当前计费单价
   */
  private async getUnitPrice(): Promise<number> {
    const rule = await this.prisma.pricingRule.findFirst({
      where: { isDefault: true, status: 'ACTIVE' },
    });
    return rule ? Number(rule.price) : 0.10;
  }

  /**
   * 安全的正则模式白名单验证
   * 仅允许简单的数字/字母匹配模式，防止 ReDoS 攻击
   */
  private sanitizeMatchPattern(match?: string): string {
    const defaultPattern = '\\d{4,8}';
    if (!match) return defaultPattern;

    // 白名单：只允许 \d \w . 以及量词 {n,m} {n}
    // 禁止嵌套量词、回溯引用、前后向断言等危险结构
    const safePatternRegex = /^[\\dw.\[\]0-9a-zA-Z\-\s{},+*?|^$]+$/;
    if (!safePatternRegex.test(match)) {
      this.logger.warn(`不安全的正则模式被拒绝: ${match}`);
      return defaultPattern;
    }

    // 额外检查：禁止嵌套量词 (如 (a+)+ ) 和过长模式
    if (match.length > 50) return defaultPattern;

    // 尝试编译以确保有效
    try {
      new RegExp(match);
    } catch {
      return defaultPattern;
    }

    return match;
  }

  /**
   * 获取一个临时邮箱
   */
  async getEmail(userId: number, dto: GetEmailDto, apiKeyId?: number) {
    const unitPrice = await this.getUnitPrice();

    // 直接冻结费用（freeze 内部已有余额检查和行锁，无需单独 checkBalance）
    await this.walletService.freeze(userId, unitPrice, '获取邮箱 - 预扣费');

    try {
      // 3. 从上游获取邮箱
      const { id: upstreamId, adapter } = await this.upstreamService.getAdapter();
      const emailResult = await adapter.getEmail(dto.group);

      // 4. 创建任务记录
      const task = await this.prisma.emailTask.create({
        data: {
          userId,
          projectId: dto.projectId || null,
          apiKeyId: apiKeyId || null,
          upstreamId,
          email: emailResult.email,
          status: 'ACTIVE',
          cost: unitPrice,
          upstreamEmail: emailResult.email,
          expireAt: new Date(Date.now() + 30 * 60 * 1000), // 30 分钟过期
        },
      });

      try {
        // 5. 确认扣费
        await this.walletService.confirmDeduct(
          userId,
          unitPrice,
          `获取邮箱: ${emailResult.email}`,
          task.id,
        );
      } catch (deductError) {
        // confirmDeduct 失败时，标记任务为 FAILED 防止产生免费孤儿任务
        this.logger.error(`确认扣费失败, taskId=${task.id}: ${deductError.message}`);
        await this.prisma.emailTask.update({
          where: { id: task.id },
          data: { status: 'FAILED', completedAt: new Date() },
        }).catch((e) => this.logger.error(`标记任务失败也失败了: ${e.message}`));
        throw deductError;
      }

      return {
        taskId: task.id,
        email: emailResult.email,
        expireAt: task.expireAt,
        cost: unitPrice,
      };
    } catch (error) {
      // 获取邮箱失败或扣费失败，解冻费用
      await this.walletService.unfreeze(userId, unitPrice, '获取邮箱失败 - 退还冻结')
        .catch((e) => this.logger.error(`解冻费用也失败了: ${e.message}`));
      throw error;
    }
  }

  /**
   * 获取验证码
   */
  async getCode(userId: number, dto: GetCodeDto) {
    // 查找活跃的任务
    const task = await this.prisma.emailTask.findFirst({
      where: {
        userId,
        email: dto.email,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!task) {
      throw new BusinessException('TASK_NOT_FOUND', '未找到对应的接码任务，请先获取邮箱');
    }

    // 检查是否过期
    if (task.expireAt && task.expireAt < new Date()) {
      await this.prisma.emailTask.update({
        where: { id: task.id },
        data: { status: 'EXPIRED' },
      });
      throw new BusinessException('TASK_EXPIRED', '接码任务已过期');
    }

    // 从上游获取验证码
    const { adapter } = await this.upstreamService.getAdapter(task.upstreamId);
    const match = this.sanitizeMatchPattern(dto.match);
    const code = await adapter.getMailText(task.email, match);

    if (code && !code.startsWith('Error:')) {
      // 更新任务
      await this.prisma.emailTask.update({
        where: { id: task.id },
        data: {
          verifyCode: code,
          matchPattern: match,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // 通过 WebSocket 推送验证码通知
      this.notificationGateway.notifyNewMail(userId, {
        taskId: task.id,
        email: task.email,
        code,
      });

      return {
        taskId: task.id,
        email: task.email,
        code,
      };
    }

    return {
      taskId: task.id,
      email: task.email,
      code: null,
      message: '暂未收到验证码，请稍后重试',
    };
  }

  /**
   * 查看邮件内容
   */
  async checkMail(userId: number, dto: CheckMailDto) {
    const task = await this.prisma.emailTask.findFirst({
      where: {
        userId,
        email: dto.email,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!task) {
      throw new BusinessException('TASK_NOT_FOUND', '未找到对应的接码任务');
    }

    const { adapter } = await this.upstreamService.getAdapter(task.upstreamId);
    const mailResult = await adapter.getMailNew(task.email, dto.mailbox);

    // 存储邮件内容
    if (mailResult.messages.length > 0) {
      const latestMail = mailResult.messages[0];
      await this.prisma.emailTask.update({
        where: { id: task.id },
        data: {
          mailSubject: latestMail.subject,
          mailContent: latestMail.text || latestMail.html,
        },
      });
    }

    return {
      taskId: task.id,
      ...mailResult,
      email: task.email,
    };
  }

  /**
   * 释放邮箱
   * 注意：释放邮箱不退费，因为获取邮箱时已经占用了上游资源并完成了扣费。
   * 释放操作仅标记任务状态为 RELEASED，用户可以不再等待验证码。
   */
  async releaseEmail(userId: number, dto: ReleaseEmailDto) {
    const task = await this.prisma.emailTask.findFirst({
      where: {
        userId,
        email: dto.email,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!task) {
      throw new BusinessException('TASK_NOT_FOUND', '未找到活跃的接码任务');
    }

    await this.prisma.emailTask.update({
      where: { id: task.id },
      data: {
        status: 'RELEASED',
        completedAt: new Date(),
      },
    });

    return {
      taskId: task.id,
      email: task.email,
      message: '邮箱已释放',
    };
  }

  /**
   * 获取用户任务列表
   */
  async getTasks(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
    status?: string,
    projectId?: number,
  ) {
    // 规范化分页参数
    page = Math.max(1, Math.floor(page) || 1);
    pageSize = Math.min(100, Math.max(1, Math.floor(pageSize) || 20));

    const where: any = { userId };
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const [items, total] = await Promise.all([
      this.prisma.emailTask.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          status: true,
          cost: true,
          verifyCode: true,
          mailSubject: true,
          matchPattern: true,
          expireAt: true,
          createdAt: true,
          completedAt: true,
          project: { select: { id: true, name: true } },
        },
      }),
      this.prisma.emailTask.count({ where }),
    ]);

    return new PaginatedResponse(items, total, page, pageSize);
  }

  /**
   * 获取单个任务详情
   */
  async getTaskDetail(userId: number, taskId: number) {
    const task = await this.prisma.emailTask.findFirst({
      where: { id: taskId, userId },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      throw new BusinessException('TASK_NOT_FOUND', '任务不存在');
    }

    return task;
  }
}
