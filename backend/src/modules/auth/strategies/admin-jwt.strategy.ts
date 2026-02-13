import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface AdminJwtPayload {
  sub: number;
  username: string;
  role: string;
  type: 'admin';
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ADMIN_SECRET'),
    });
  }

  async validate(payload: AdminJwtPayload) {
    // 每次请求重新验证 admin 状态和角色，防止被禁用或降权后继续操作
    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true, role: true, username: true },
    });

    if (!admin || admin.status !== 'ACTIVE') {
      throw new UnauthorizedException('管理员账户已被禁用或不存在');
    }

    return {
      id: admin.id,
      username: admin.username,
      role: admin.role, // 使用数据库最新角色，而非 JWT 中的缓存值
      type: payload.type,
    };
  }
}
