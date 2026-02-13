import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto, LoginDto, ChangePasswordDto, AdminLoginDto } from './dto/auth.dto';

interface PrismaUniqueErrorShape {
  code: string;
  meta?: { target?: unknown };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ========== 用户认证 ==========

  private isPrismaUniqueError(error: unknown): error is PrismaUniqueErrorShape {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
    );
  }

  async register(dto: RegisterDto) {
    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });
    if (existingUser) {
      throw new ConflictException(
        existingUser.username === dto.username ? '用户名已存在' : '邮箱已被注册',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            username: dto.username,
            email: dto.email,
            passwordHash,
          },
        });

        // 创建钱包
        await tx.wallet.create({
          data: { userId: newUser.id },
        });

        // 创建默认项目
        await tx.project.create({
          data: {
            userId: newUser.id,
            name: '默认项目',
          },
        });

        return newUser;
      });

      const token = this.generateUserToken(user.id, user.username);

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      };
    } catch (error: unknown) {
      // 捕获 Prisma 唯一约束冲突（并发注册场景）
      if (this.isPrismaUniqueError(error) && error.code === 'P2002') {
        const target = error.meta?.target;
        const field = Array.isArray(target) && target.includes('username') ? '用户名' : '邮箱';
        throw new ConflictException(`${field}已存在`);
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const [admin, user] = await Promise.all([
      this.prisma.admin.findUnique({ where: { username: dto.username } }),
      this.prisma.user.findUnique({ where: { username: dto.username } }),
    ]);

    if (admin && admin.status === 'ACTIVE') {
      const isAdminPasswordValid = await bcrypt.compare(dto.password, admin.passwordHash);
      if (isAdminPasswordValid) {
        const token = this.generateAdminToken(admin.id, admin.username, admin.role);
        return {
          sessionType: 'admin' as const,
          token,
          admin: {
            id: admin.id,
            username: admin.username,
            role: admin.role,
          },
        };
      }
    }

    if (user && user.status === 'ACTIVE') {
      const isUserPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (isUserPasswordValid) {
        const token = this.generateUserToken(user.id, user.username);
        return {
          sessionType: 'user' as const,
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        };
      }
    }

    const hasDisabledAccount =
      (admin && admin.status !== 'ACTIVE') || (user && user.status !== 'ACTIVE');
    if (hasDisabledAccount) {
      throw new UnauthorizedException('账号已禁用');
    }

    throw new UnauthorizedException('用户名或密码错误');
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      id: user.id,
      userId: user.id,
      username: user.username,
      userName: user.username,
      email: user.email,
      status: user.status,
      balance: user.wallet?.balance || 0,
      createdAt: user.createdAt,
      roles: ['R_USER'],
      buttons: [],
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');

    const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('旧密码错误');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: '密码修改成功' };
  }

  // ========== 管理员认证 ==========

  async adminLogin(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });

    if (!admin) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (admin.status !== 'ACTIVE') {
      throw new UnauthorizedException('账户已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const token = this.generateAdminToken(admin.id, admin.username, admin.role);

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    };
  }

  async getAdminMe(adminId: number) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) throw new UnauthorizedException('管理员不存在');

    return {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      status: admin.status,
      createdAt: admin.createdAt,
    };
  }

  // ========== Token 生成 ==========

  private generateUserToken(userId: number, username: string): string {
    return this.jwtService.sign(
      { sub: userId, username, type: 'user' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      },
    );
  }

  private generateAdminToken(adminId: number, username: string, role: string): string {
    return this.jwtService.sign(
      { sub: adminId, username, role, type: 'admin' },
      {
        secret: this.configService.get<string>('JWT_ADMIN_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ADMIN_EXPIRES_IN', '1d'),
      },
    );
  }
}

