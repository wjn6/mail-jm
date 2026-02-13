import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ProjectModule } from './modules/project/project.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { TaskModule } from './modules/task/task.module';
import { UpstreamModule } from './modules/upstream/upstream.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationModule } from './modules/notification/notification.module';
import { GatewayApiModule } from './gateway/gateway.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 秒
        limit: 10, // 每秒最多 10 次
      },
      {
        name: 'medium',
        ttl: 60000, // 1 分钟
        limit: 100, // 每分钟最多 100 次
      },
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UserModule,
    WalletModule,
    ProjectModule,
    ApiKeyModule,
    TaskModule,
    UpstreamModule,
    AdminModule,
    NotificationModule,
    GatewayApiModule,
    StatsModule,
  ],
})
export class AppModule {}
