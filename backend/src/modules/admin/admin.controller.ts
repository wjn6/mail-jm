import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminJwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { NotificationGateway } from '../notification/notification.gateway';
import {
  CreateUpstreamDto, UpdateUpstreamDto,
  CreatePricingRuleDto, UpdatePricingRuleDto,
  CreateAnnouncementDto, UpdateAnnouncementDto,
  RechargeUserDto, UpdateUserStatusDto,
  CreateAdminDto,
} from './dto/admin.dto';

@ApiTags('管理后台')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private notificationGateway: NotificationGateway,
  ) {}

  // ===== 用户管理 =====
  @Get('users')
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers(page, pageSize, keyword, status);
  }

  @Get('users/:id')
  getUserDetail(@Param('id', ParseIntPipe) userId: number) {
    return this.adminService.getUserDetail(userId);
  }

  @Put('users/:id/status')
  async updateUserStatus(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: any,
  ) {
    const result = await this.adminService.updateUserStatus(userId, dto.status);
    await this.adminService.logAction(adminId, 'UPDATE_USER_STATUS', 'USER', userId, { status: dto.status }, req.ip);
    return result;
  }

  @Post('users/:id/recharge')
  async rechargeUser(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: RechargeUserDto,
    @Req() req: any,
  ) {
    const result = await this.adminService.rechargeUser(userId, dto.amount, dto.description);
    await this.adminService.logAction(adminId, 'RECHARGE_USER', 'USER', userId, { amount: dto.amount }, req.ip);
    return result;
  }

  // ===== 订单管理 =====
  @Get('orders')
  getOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('email') email?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const parsedUserId = userId ? Number.parseInt(userId, 10) : Number.NaN;
    const normalizedUserId = Number.isNaN(parsedUserId) ? undefined : parsedUserId;
    return this.adminService.getOrders(page, pageSize, {
      status,
      userId: normalizedUserId,
      email,
      startDate,
      endDate,
    });
  }

  // ===== 上游管理 =====
  @Get('upstreams')
  getUpstreams() {
    return this.adminService.getUpstreams();
  }

  @Post('upstreams')
  async createUpstream(
    @CurrentUser('id') adminId: number,
    @Body() dto: CreateUpstreamDto,
    @Req() req: any,
  ) {
    const result = await this.adminService.createUpstream(dto);
    // 日志中脱敏 apiKey
    const logDetail = { ...dto, apiKey: dto.apiKey ? '****' : undefined };
    await this.adminService.logAction(adminId, 'CREATE_UPSTREAM', 'UPSTREAM', result.id, logDetail, req.ip);
    return result;
  }

  @Put('upstreams/:id')
  async updateUpstream(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUpstreamDto,
    @Req() req: any,
  ) {
    const result = await this.adminService.updateUpstream(id, dto);
    const logDetail = { ...dto, apiKey: dto.apiKey ? '****' : undefined };
    await this.adminService.logAction(adminId, 'UPDATE_UPSTREAM', 'UPSTREAM', id, logDetail, req.ip);
    return result;
  }

  @Delete('upstreams/:id')
  async deleteUpstream(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const result = await this.adminService.deleteUpstream(id);
    await this.adminService.logAction(adminId, 'DELETE_UPSTREAM', 'UPSTREAM', id, {}, req.ip);
    return result;
  }

  @Get('upstreams/health')
  checkUpstreamHealth() {
    return this.adminService.checkUpstreamHealth();
  }

  // ===== 财务管理 =====
  @Get('finance/stats')
  getFinanceStats(@Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number) {
    return this.adminService.getFinanceStats(days);
  }

  @Get('finance/recharge-records')
  getRechargeRecords(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.adminService.getRechargeRecords(page, pageSize);
  }

  // ===== 计费规则 =====
  @Get('pricing')
  getPricingRules() {
    return this.adminService.getPricingRules();
  }

  @Post('pricing')
  async createPricingRule(
    @CurrentUser('id') adminId: number,
    @Body() dto: CreatePricingRuleDto,
    @Req() req: any,
  ) {
    const result = await this.adminService.createPricingRule(dto);
    await this.adminService.logAction(adminId, 'CREATE_PRICING', 'PRICING', result.id, dto, req.ip);
    return result;
  }

  @Put('pricing/:id')
  async updatePricingRule(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePricingRuleDto,
    @Req() req: any,
  ) {
    const result = await this.adminService.updatePricingRule(id, dto);
    await this.adminService.logAction(adminId, 'UPDATE_PRICING', 'PRICING', id, dto, req.ip);
    return result;
  }

  @Delete('pricing/:id')
  async deletePricingRule(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const result = await this.adminService.deletePricingRule(id);
    await this.adminService.logAction(adminId, 'DELETE_PRICING', 'PRICING', id, {}, req.ip);
    return result;
  }

  // ===== 公告管理 =====
  @Get('announcements')
  getAnnouncements(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.adminService.getAnnouncements(page, pageSize);
  }

  @Post('announcements')
  async createAnnouncement(
    @CurrentUser('id') adminId: number,
    @Body() dto: CreateAnnouncementDto,
    @Req() req: any,
  ) {
    const result = await this.adminService.createAnnouncement(dto);
    // 广播公告
    this.notificationGateway.broadcastAnnouncement({ title: dto.title, content: dto.content });
    await this.adminService.logAction(adminId, 'CREATE_ANNOUNCEMENT', 'ANNOUNCEMENT', result.id, dto, req.ip);
    return result;
  }

  @Put('announcements/:id')
  async updateAnnouncement(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnnouncementDto,
    @Req() req: any,
  ) {
    const result = await this.adminService.updateAnnouncement(id, dto);
    await this.adminService.logAction(adminId, 'UPDATE_ANNOUNCEMENT', 'ANNOUNCEMENT', id, dto, req.ip);
    return result;
  }

  @Delete('announcements/:id')
  async deleteAnnouncement(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const result = await this.adminService.deleteAnnouncement(id);
    await this.adminService.logAction(adminId, 'DELETE_ANNOUNCEMENT', 'ANNOUNCEMENT', id, {}, req.ip);
    return result;
  }

  // ===== 管理员管理 =====
  @Roles('SUPER_ADMIN')
  @Get('admins')
  getAdmins() {
    return this.adminService.getAdmins();
  }

  @Roles('SUPER_ADMIN')
  @Post('admins')
  async createAdmin(
    @CurrentUser('id') adminId: number,
    @Body() dto: CreateAdminDto,
    @Req() req: any,
  ) {
    const result = await this.adminService.createAdmin(dto);
    await this.adminService.logAction(adminId, 'CREATE_ADMIN', 'ADMIN', result.id, { username: dto.username }, req.ip);
    return result;
  }

  @Roles('SUPER_ADMIN')
  @Delete('admins/:id')
  async deleteAdmin(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const result = await this.adminService.deleteAdmin(id);
    await this.adminService.logAction(adminId, 'DELETE_ADMIN', 'ADMIN', id, {}, req.ip);
    return result;
  }

  // ===== 操作日志 =====
  @Get('logs')
  getAdminLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.adminService.getAdminLogs(page, pageSize);
  }
}
