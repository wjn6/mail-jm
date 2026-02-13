import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalTasks,
      todayTasks,
      activeTasks,
      totalRecharge,
      todayRecharge,
      totalConsume,
      upstreamCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.emailTask.count(),
      this.prisma.emailTask.count({ where: { createdAt: { gte: today } } }),
      this.prisma.emailTask.count({ where: { status: 'ACTIVE' } }),
      this.prisma.transaction.aggregate({
        where: { type: 'RECHARGE' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { type: 'RECHARGE', createdAt: { gte: today } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { type: 'CONSUME' },
        _sum: { amount: true },
      }),
      this.prisma.upstreamSource.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      totalUsers,
      totalTasks,
      todayTasks,
      activeTasks,
      totalRecharge: Math.abs(Number(totalRecharge._sum.amount || 0)),
      todayRecharge: Math.abs(Number(todayRecharge._sum.amount || 0)),
      totalConsume: Math.abs(Number(totalConsume._sum.amount || 0)),
      upstreamCount,
    };
  }

  /**
   * 获取任务趋势 - 使用数据库层面聚合，避免全量加载到内存
   */
  async getTaskTrend(days: number = 7) {
    // 限制最大查询天数
    days = Math.min(days, 90);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // 使用 $queryRaw 在数据库层面进行日期分组聚合
    const results = await this.prisma.$queryRaw<
      { date: string; total: bigint; completed: bigint; failed: bigint }[]
    >`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status IN ('FAILED', 'EXPIRED')) as failed
      FROM email_tasks
      WHERE created_at >= ${startDate}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    // 构建完整的日期范围（从 startDate 到 今天，共 days 天）
    const trendMap: Record<string, { total: number; completed: number; failed: number }> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split('T')[0];
      trendMap[key] = { total: 0, completed: 0, failed: 0 };
    }

    // 合并数据库查询结果
    for (const row of results) {
      if (trendMap[row.date]) {
        trendMap[row.date] = {
          total: Number(row.total),
          completed: Number(row.completed),
          failed: Number(row.failed),
        };
      }
    }

    return Object.entries(trendMap).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  async getActiveAnnouncements() {
    return this.prisma.announcement.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    });
  }
}
