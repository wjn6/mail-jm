import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { AdminJwtAuthGuard } from '../../common/guards';
import { Public } from '../../common/decorators';

@ApiTags('统计')
@Controller()
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Public()
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @Get('admin/dashboard/stats')
  getDashboardStats() {
    return this.statsService.getDashboardStats();
  }

  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @Get('admin/dashboard/trend')
  getTaskTrend(@Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number) {
    return this.statsService.getTaskTrend(days);
  }

  @Public()
  @Get('public/announcements')
  getActiveAnnouncements() {
    return this.statsService.getActiveAnnouncements();
  }
}
