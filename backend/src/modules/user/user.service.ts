import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * 用户端工作台数据
   */
  async getUserDashboard(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [wallet, todayTasks, totalTasks, activeTasks, projectCount] = await Promise.all([
      this.prisma.wallet.findUnique({ where: { userId } }),
      this.prisma.emailTask.count({ where: { userId, createdAt: { gte: today } } }),
      this.prisma.emailTask.count({ where: { userId } }),
      this.prisma.emailTask.count({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.project.count({ where: { userId } }),
    ]);

    return {
      balance: wallet?.balance || 0,
      frozenBalance: wallet?.frozenBalance || 0,
      todayTasks,
      totalTasks,
      activeTasks,
      projectCount,
    };
  }

  /**
   * 用户最近任务
   */
  async getRecentTasks(userId: number, limit: number = 10) {
    return this.prisma.emailTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        status: true,
        cost: true,
        verifyCode: true,
        createdAt: true,
        completedAt: true,
      },
    });
  }
}
