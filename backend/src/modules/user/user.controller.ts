import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('用户中心')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser('id') userId: number) {
    return this.userService.getUserDashboard(userId);
  }

  @Get('recent-tasks')
  getRecentTasks(@CurrentUser('id') userId: number) {
    return this.userService.getRecentTasks(userId);
  }
}
