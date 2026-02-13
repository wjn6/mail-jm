import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('项目管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user/projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  getProjects(@CurrentUser('id') userId: number) {
    return this.projectService.getProjects(userId);
  }

  @Get(':id')
  getProject(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) projectId: number,
  ) {
    return this.projectService.getProject(userId, projectId);
  }

  @Post()
  createProject(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectService.createProject(userId, dto.name);
  }

  @Put(':id')
  updateProject(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) projectId: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(userId, projectId, dto);
  }

  @Delete(':id')
  deleteProject(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) projectId: number,
  ) {
    return this.projectService.deleteProject(userId, projectId);
  }
}
