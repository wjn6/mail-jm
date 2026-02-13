import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { UpstreamService } from '../upstream/upstream.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { PaginatedResponse } from '../../common/dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private upstreamService: UpstreamService,
  ) {}

  // ========== 用户管理 ==========

  /**
   * 规范化分页参数
   */
  private sanitizePagination(page: number, pageSize: number) {
    return {
      page: Math.max(1, Math.floor(page) || 1),
      pageSize: Math.min(100, Math.max(1, Math.floor(pageSize) || 20)),
    };
  }

  async getUsers(page: number, pageSize: number, keyword?: string, status?: string) {
    ({ page, pageSize } = this.sanitizePagination(page, pageSize));
    const where: Record<string, unknown> = {};
    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          wallet: { select: { balance: true, frozenBalance: true } },
          _count: { select: { emailTasks: true, projects: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    const safeItems = items.map((item) => {
      const { passwordHash, ...safeUser } = item;
      void passwordHash;
      return safeUser;
    });
    return new PaginatedResponse(safeItems, total, page, pageSize);
  }

  async getUserDetail(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        projects: { include: { _count: { select: { apiKeys: true } } } },
        _count: { select: { emailTasks: true, transactions: true } },
      },
    });
    if (!user) throw new BusinessException('USER_NOT_FOUND', '用户不存在');
    const { passwordHash, ...safeUser } = user;
    void passwordHash;
    return safeUser;
  }

  async updateUserStatus(userId: number, status: string) {
    const validStatuses = ['ACTIVE', 'DISABLED'];
    if (!validStatuses.includes(status)) {
      throw new BusinessException(
        'INVALID_STATUS',
        `无效的状态值，允许值: ${validStatuses.join(', ')}`,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', '用户不存在');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
    return { message: '用户状态已更新' };
  }

  async rechargeUser(userId: number, amount: number, description?: string) {
    if (!amount || amount <= 0) {
      throw new BusinessException('INVALID_AMOUNT', '充值金额必须大于 0');
    }
    await this.walletService.recharge(userId, amount, description || '管理员充值');
    return { message: `已为用户充值 ${amount} 元` };
  }

  // ========== 订单管理 ==========

  async getOrders(
    page: number,
    pageSize: number,
    filters: {
      status?: string;
      userId?: number;
      email?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    ({ page, pageSize } = this.sanitizePagination(page, pageSize));
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.userId) where.userId = filters.userId;
    if (filters.email) where.email = { contains: filters.email, mode: 'insensitive' };
    if (filters.startDate || filters.endDate) {
      const createdAt: { gte?: Date; lte?: Date } = {};
      if (filters.startDate) createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) createdAt.lte = new Date(filters.endDate);
      where.createdAt = createdAt;
    }

    const [items, total] = await Promise.all([
      this.prisma.emailTask.findMany({
        where,
        include: {
          user: { select: { id: true, username: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.emailTask.count({ where }),
    ]);

    return new PaginatedResponse(items, total, page, pageSize);
  }

  // ========== 上游管理 ==========

  async getUpstreams() {
    const upstreams = await this.prisma.upstreamSource.findMany({
      orderBy: { priority: 'desc' },
    });
    // 脱敏 API Key，只显示前4位和后4位
    return upstreams.map((u) => ({
      ...u,
      apiKey: u.apiKey ? `${u.apiKey.substring(0, 4)}****${u.apiKey.slice(-4)}` : '',
    }));
  }

  async createUpstream(data: {
    name: string;
    type: string;
    baseUrl: string;
    apiKey: string;
    priority?: number;
    config?: unknown;
  }) {
    const upstream = await this.prisma.upstreamSource.create({
      data: {
        name: data.name,
        type: data.type,
        baseUrl: data.baseUrl,
        apiKey: data.apiKey,
        priority: data.priority || 0,
        config: data.config || {},
      },
    });

    await this.upstreamService.refreshAdapters();
    return upstream;
  }

  async updateUpstream(
    id: number,
    data: {
      name?: string;
      type?: string;
      baseUrl?: string;
      apiKey?: string;
      status?: string;
      priority?: number;
      config?: unknown;
    },
  ) {
    // 检查记录是否存在
    const existing = await this.prisma.upstreamSource.findUnique({ where: { id } });
    if (!existing) {
      throw new BusinessException('UPSTREAM_NOT_FOUND', '上游源不存在');
    }

    // 只允许更新白名单字段
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
    if (data.apiKey !== undefined) updateData.apiKey = data.apiKey;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.config !== undefined) updateData.config = data.config;

    const upstream = await this.prisma.upstreamSource.update({
      where: { id },
      data: updateData,
    });
    await this.upstreamService.refreshAdapters();
    return upstream;
  }

  async deleteUpstream(id: number) {
    // 检查是否有活跃任务正在使用此上游源
    const activeTasks = await this.prisma.emailTask.count({
      where: { upstreamId: id, status: 'ACTIVE' },
    });
    if (activeTasks > 0) {
      throw new BusinessException(
        'UPSTREAM_IN_USE',
        `该上游源正在被 ${activeTasks} 个活跃任务使用，无法删除`,
      );
    }

    await this.prisma.upstreamSource.delete({ where: { id } });
    await this.upstreamService.refreshAdapters();
    return { message: '上游源已删除' };
  }

  async checkUpstreamHealth() {
    return this.upstreamService.healthCheckAll();
  }

  // ========== 财务管理 ==========

  async getFinanceStats(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [rechargeSum, consumeSum, refundSum, transactionCount] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { type: 'RECHARGE', createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { type: 'CONSUME', createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { type: 'REFUND', createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    return {
      rechargeTotal: Math.abs(Number(rechargeSum._sum.amount || 0)),
      consumeTotal: Math.abs(Number(consumeSum._sum.amount || 0)),
      refundTotal: Math.abs(Number(refundSum._sum.amount || 0)),
      transactionCount,
      period: `${days} 天`,
    };
  }

  async getRechargeRecords(page: number, pageSize: number) {
    ({ page, pageSize } = this.sanitizePagination(page, pageSize));
    const where = { type: 'RECHARGE' };
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { user: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return new PaginatedResponse(items, total, page, pageSize);
  }

  // ========== 计费规则 ==========

  async getPricingRules() {
    return this.prisma.pricingRule.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createPricingRule(data: {
    name: string;
    type: string;
    price: number;
    description?: string;
    isDefault?: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.pricingRule.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.pricingRule.create({ data: { ...data, price: data.price } });
    });
  }

  async updatePricingRule(
    id: number,
    data: {
      name?: string;
      type?: string;
      price?: number;
      description?: string;
      isDefault?: boolean;
      status?: string;
    },
  ) {
    const existing = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!existing) {
      throw new BusinessException('PRICING_NOT_FOUND', '计费规则不存在');
    }

    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.pricingRule.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.pricingRule.update({ where: { id }, data });
    });
  }

  async deletePricingRule(id: number) {
    const rule = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!rule) {
      throw new BusinessException('PRICING_NOT_FOUND', '计费规则不存在');
    }
    if (rule.isDefault) {
      throw new BusinessException(
        'CANNOT_DELETE_DEFAULT',
        '不能删除默认计费规则，请先设置其他规则为默认',
      );
    }
    await this.prisma.pricingRule.delete({ where: { id } });
    return { message: '计费规则已删除' };
  }

  // ========== 公告管理 ==========

  async getAnnouncements(page: number = 1, pageSize: number = 20) {
    const [items, total] = await Promise.all([
      this.prisma.announcement.findMany({
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.announcement.count(),
    ]);
    return new PaginatedResponse(items, total, page, pageSize);
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
    type?: string;
    pinned?: boolean;
  }) {
    return this.prisma.announcement.create({ data });
  }

  async updateAnnouncement(
    id: number,
    data: {
      title?: string;
      content?: string;
      type?: string;
      status?: string;
      pinned?: boolean;
    },
  ) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw new BusinessException('ANNOUNCEMENT_NOT_FOUND', '公告不存在');
    }
    return this.prisma.announcement.update({ where: { id }, data });
  }

  async deleteAnnouncement(id: number) {
    await this.prisma.announcement.delete({ where: { id } });
    return { message: '公告已删除' };
  }

  // ========== 管理员管理 ==========

  async getAdmins() {
    return this.prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async createAdmin(data: { username: string; password: string; role?: string }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.admin.create({
      data: {
        username: data.username,
        passwordHash,
        role: data.role || 'ADMIN',
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async deleteAdmin(id: number) {
    const admin = await this.prisma.admin.findUnique({ where: { id } });
    if (admin?.role === 'SUPER_ADMIN') {
      throw new BusinessException('FORBIDDEN', '不能删除超级管理员');
    }
    await this.prisma.admin.delete({ where: { id } });
    return { message: '管理员已删除' };
  }

  // ========== 操作日志 ==========

  async logAction(
    adminId: number,
    action: string,
    targetType?: string,
    targetId?: number,
    detail?: unknown,
    ip?: string,
  ) {
    type AdminLogCreateArg = Parameters<typeof this.prisma.adminLog.create>[0];
    type AdminLogDetail = AdminLogCreateArg extends { data: { detail?: infer D } } ? D : unknown;

    await this.prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        detail: detail as AdminLogDetail,
        ip,
      },
    });
  }

  async getAdminLogs(page: number, pageSize: number) {
    ({ page, pageSize } = this.sanitizePagination(page, pageSize));
    const [items, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        include: { admin: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.adminLog.count(),
    ]);
    return new PaginatedResponse(items, total, page, pageSize);
  }
}
