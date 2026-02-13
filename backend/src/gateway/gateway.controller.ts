import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyGuard } from './api-key.guard';
import { TaskService } from '../modules/task/task.service';
import { WalletService } from '../modules/wallet/wallet.service';
import { AuthenticatedApiGatewayRequest } from './gateway.types';

@ApiTags('Gateway API (对外接口)')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('gateway')
export class GatewayController {
  constructor(
    private taskService: TaskService,
    private walletService: WalletService,
  ) {}

  /**
   * 获取一个可用邮箱
   */
  @Get('get-email')
  @Post('get-email')
  async getEmail(@Req() req: AuthenticatedApiGatewayRequest, @Query('group') group?: string) {
    const { userId, projectId, apiKeyId } = req.apiKeyUser;
    return this.taskService.getEmail(userId, { projectId, group }, apiKeyId);
  }

  /**
   * 获取验证码
   */
  @Get('get-code')
  @Post('get-code')
  async getCode(
    @Req() req: AuthenticatedApiGatewayRequest,
    @Query('email') queryEmail?: string,
    @Query('match') queryMatch?: string,
    @Body() body?: { email?: string; match?: string },
  ) {
    const { userId } = req.apiKeyUser;
    const email = queryEmail || body?.email;
    const match = queryMatch || body?.match;

    if (!email) {
      throw new BadRequestException('缺少 email 参数');
    }

    return this.taskService.getCode(userId, { email, match });
  }

  /**
   * 查看最新邮件
   */
  @Get('check-mail')
  @Post('check-mail')
  async checkMail(
    @Req() req: AuthenticatedApiGatewayRequest,
    @Query('email') queryEmail?: string,
    @Query('mailbox') queryMailbox?: string,
    @Body() body?: { email?: string; mailbox?: string },
  ) {
    const { userId } = req.apiKeyUser;
    const email = queryEmail || body?.email;
    const mailbox = queryMailbox || body?.mailbox;

    if (!email) {
      throw new BadRequestException('缺少 email 参数');
    }

    return this.taskService.checkMail(userId, { email, mailbox });
  }

  /**
   * 释放邮箱
   */
  @Post('release')
  async releaseEmail(
    @Req() req: AuthenticatedApiGatewayRequest,
    @Query('email') queryEmail?: string,
    @Body() body?: { email?: string },
  ) {
    const { userId } = req.apiKeyUser;
    const email = queryEmail || body?.email;

    if (!email) {
      throw new BadRequestException('缺少 email 参数');
    }

    return this.taskService.releaseEmail(userId, { email });
  }

  /**
   * 查询余额
   */
  @Get('balance')
  async getBalance(@Req() req: AuthenticatedApiGatewayRequest) {
    const { userId } = req.apiKeyUser;
    const wallet = await this.walletService.getWallet(userId);
    return {
      balance: wallet.balance,
      frozenBalance: wallet.frozenBalance,
    };
  }

  /**
   * 查询任务列表
   */
  @Get('tasks')
  async getTasks(
    @Req() req: AuthenticatedApiGatewayRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('status') status?: string,
  ) {
    const { userId, projectId } = req.apiKeyUser;
    return this.taskService.getTasks(userId, page, pageSize, status, projectId);
  }
}
