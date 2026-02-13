import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { GetEmailDto, GetCodeDto, CheckMailDto, ReleaseEmailDto } from './dto/task.dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('接码任务')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user/task')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post('get-email')
  getEmail(@CurrentUser('id') userId: number, @Body() dto: GetEmailDto) {
    return this.taskService.getEmail(userId, dto);
  }

  @Post('get-code')
  getCode(@CurrentUser('id') userId: number, @Body() dto: GetCodeDto) {
    return this.taskService.getCode(userId, dto);
  }

  @Post('check-mail')
  checkMail(@CurrentUser('id') userId: number, @Body() dto: CheckMailDto) {
    return this.taskService.checkMail(userId, dto);
  }

  @Post('release')
  releaseEmail(@CurrentUser('id') userId: number, @Body() dto: ReleaseEmailDto) {
    return this.taskService.releaseEmail(userId, dto);
  }

  @Get('list')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  getTasks(
    @CurrentUser('id') userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
  ) {
    const parsedProjectId = projectId ? Number.parseInt(projectId, 10) : Number.NaN;
    const normalizedProjectId = Number.isNaN(parsedProjectId) ? undefined : parsedProjectId;
    return this.taskService.getTasks(userId, page, pageSize, status, normalizedProjectId);
  }

  @Get(':id')
  getTaskDetail(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) taskId: number) {
    return this.taskService.getTaskDetail(userId, taskId);
  }
}
