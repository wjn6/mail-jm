import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  InsufficientBalanceException,
  BusinessException,
} from '../../common/exceptions/business.exception';
import { PaginatedResponse } from '../../common/dto';

interface WalletRow {
  balance: string | number;
  frozen_balance: string | number;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {}

  async getWallet(userId: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return this.prisma.wallet.create({
        data: { userId },
      });
    }
    return wallet;
  }

  /**
   * 冻结金额 - 使用 SELECT ... FOR UPDATE 防止并发超额冻结
   */
  async freeze(userId: number, amount: number, description: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 使用行锁查询钱包
      const wallets = await tx.$queryRaw<WalletRow[]>`
        SELECT * FROM wallets WHERE user_id = ${userId} FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new BusinessException('WALLET_NOT_FOUND', '钱包不存在');
      }

      const wallet = wallets[0];
      const balance = Number(wallet.balance);
      const frozenBalance = Number(wallet.frozen_balance);
      const available = balance - frozenBalance;

      if (available < amount) {
        throw new InsufficientBalanceException();
      }

      // 使用条件更新防止冻结余额超过总余额
      const result = await tx.$executeRaw`
        UPDATE wallets
        SET frozen_balance = frozen_balance + ${amount}::decimal
        WHERE user_id = ${userId}
          AND (balance - frozen_balance) >= ${amount}::decimal
      `;

      if (result === 0) {
        throw new InsufficientBalanceException();
      }

      await tx.transaction.create({
        data: {
          userId,
          type: 'FREEZE',
          amount: -amount,
          balanceBefore: balance,
          balanceAfter: balance,
          description,
        },
      });
    });
  }

  /**
   * 确认扣费 - 从冻结金额中扣除
   */
  async confirmDeduct(
    userId: number,
    amount: number,
    description: string,
    taskId?: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const wallets = await tx.$queryRaw<WalletRow[]>`
        SELECT * FROM wallets WHERE user_id = ${userId} FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new BusinessException('WALLET_NOT_FOUND', '钱包不存在');
      }

      const wallet = wallets[0];
      const balanceBefore = Number(wallet.balance);
      const frozenBefore = Number(wallet.frozen_balance);
      const balanceAfter = balanceBefore - amount;

      // 确保冻结余额不会变成负数
      if (frozenBefore < amount) {
        throw new BusinessException('WALLET_ERROR', '冻结余额异常');
      }

      const result = await tx.$executeRaw`
        UPDATE wallets
        SET balance = balance - ${amount}::decimal,
            frozen_balance = frozen_balance - ${amount}::decimal
        WHERE user_id = ${userId}
          AND frozen_balance >= ${amount}::decimal
          AND balance >= ${amount}::decimal
      `;

      if (result === 0) {
        throw new BusinessException('WALLET_ERROR', '扣费失败，余额或冻结金额异常');
      }

      await tx.transaction.create({
        data: {
          userId,
          type: 'CONSUME',
          amount: -amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description,
          relatedTaskId: taskId,
        },
      });
    });
  }

  /**
   * 解冻金额
   */
  async unfreeze(userId: number, amount: number, description: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const wallets = await tx.$queryRaw<WalletRow[]>`
        SELECT * FROM wallets WHERE user_id = ${userId} FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new BusinessException('WALLET_NOT_FOUND', '钱包不存在');
      }

      const wallet = wallets[0];
      const frozenBalance = Number(wallet.frozen_balance);

      // 防止冻结余额变成负数
      const unfreezeAmount = Math.min(amount, frozenBalance);
      if (unfreezeAmount <= 0) {
        this.logger.warn(
          `解冻金额异常: userId=${userId}, amount=${amount}, frozenBalance=${frozenBalance}`,
        );
        return;
      }

      await tx.$executeRaw`
        UPDATE wallets
        SET frozen_balance = GREATEST(frozen_balance - ${unfreezeAmount}::decimal, 0)
        WHERE user_id = ${userId}
      `;

      await tx.transaction.create({
        data: {
          userId,
          type: 'UNFREEZE',
          amount: unfreezeAmount,
          balanceBefore: Number(wallet.balance),
          balanceAfter: Number(wallet.balance),
          description,
        },
      });
    });
  }

  /**
   * 充值
   */
  async recharge(
    userId: number,
    amount: number,
    description: string,
    refNo?: string,
  ): Promise<void> {
    if (amount <= 0) {
      throw new BusinessException('INVALID_AMOUNT', '充值金额必须大于 0');
    }

    await this.prisma.$transaction(async (tx) => {
      const wallets = await tx.$queryRaw<WalletRow[]>`
        SELECT * FROM wallets WHERE user_id = ${userId} FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new BusinessException('WALLET_NOT_FOUND', '钱包不存在');
      }

      const wallet = wallets[0];
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      await tx.$executeRaw`
        UPDATE wallets
        SET balance = balance + ${amount}::decimal
        WHERE user_id = ${userId}
      `;

      await tx.transaction.create({
        data: {
          userId,
          type: 'RECHARGE',
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description,
          refNo,
        },
      });
    });
  }

  /**
   * 退款
   */
  async refund(
    userId: number,
    amount: number,
    description: string,
    taskId?: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const wallets = await tx.$queryRaw<WalletRow[]>`
        SELECT * FROM wallets WHERE user_id = ${userId} FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new BusinessException('WALLET_NOT_FOUND', '钱包不存在');
      }

      const wallet = wallets[0];
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      await tx.$executeRaw`
        UPDATE wallets
        SET balance = balance + ${amount}::decimal
        WHERE user_id = ${userId}
      `;

      await tx.transaction.create({
        data: {
          userId,
          type: 'REFUND',
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description,
          relatedTaskId: taskId,
        },
      });
    });
  }

  async getTransactions(userId: number, page: number = 1, pageSize: number = 20, type?: string) {
    // 确保参数合法
    page = Math.max(1, Math.floor(page) || 1);
    pageSize = Math.min(100, Math.max(1, Math.floor(pageSize) || 20));

    const where: Record<string, unknown> = { userId };
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return new PaginatedResponse(items, total, page, pageSize);
  }
}
