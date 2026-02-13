import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ChangePasswordDto, AdminLoginDto } from './dto/auth.dto';
import { JwtAuthGuard, AdminJwtAuthGuard } from '../../common/guards';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('用户认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle([{ name: 'short', ttl: 60000, limit: 5 }]) // 每分钟最多 5 次注册
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle([{ name: 'short', ttl: 60000, limit: 10 }]) // 每分钟最多 10 次登录尝试
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  getMe(@CurrentUser('id') userId: number) {
    return this.authService.getMe(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  changePassword(
    @CurrentUser('id') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }
}

@ApiTags('管理员认证')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle([{ name: 'short', ttl: 60000, limit: 10 }]) // 管理员登录也限流
  @Post('login')
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }

  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  getAdminMe(@CurrentUser('id') adminId: number) {
    return this.authService.getAdminMe(adminId);
  }
}
