import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController, AdminAuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    PrismaModule,
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService, JwtStrategy, AdminJwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
