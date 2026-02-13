import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(private prisma: PrismaService) {}

  async getProjects(userId: number) {
    return this.prisma.project.findMany({
      where: { userId },
      include: {
        _count: { select: { apiKeys: true, emailTasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProject(userId: number, projectId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        apiKeys: {
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            rateLimit: true,
            status: true,
            expiresAt: true,
            createdAt: true,
          },
        },
        _count: { select: { emailTasks: true } },
      },
    });

    if (!project) {
      throw new BusinessException('PROJECT_NOT_FOUND', '项目不存在');
    }

    return project;
  }

  async createProject(userId: number, name: string) {
    const count = await this.prisma.project.count({ where: { userId } });
    if (count >= 10) {
      throw new BusinessException('PROJECT_LIMIT', '最多创建 10 个项目');
    }

    return this.prisma.project.create({
      data: { userId, name },
    });
  }

  async updateProject(userId: number, projectId: number, data: { name?: string; status?: string }) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new BusinessException('PROJECT_NOT_FOUND', '项目不存在');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  async deleteProject(userId: number, projectId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new BusinessException('PROJECT_NOT_FOUND', '项目不存在');
    }

    // 检查是否有活跃任务
    const activeTasks = await this.prisma.emailTask.count({
      where: { projectId, status: 'ACTIVE' },
    });

    if (activeTasks > 0) {
      throw new BusinessException(
        'PROJECT_HAS_ACTIVE_TASKS',
        `该项目下还有 ${activeTasks} 个活跃任务，请先完成或释放这些任务`,
      );
    }

    await this.prisma.project.delete({ where: { id: projectId } });
    return { message: '项目已删除' };
  }
}
