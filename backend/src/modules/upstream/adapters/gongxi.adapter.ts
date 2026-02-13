import { Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  IUpstreamAdapter,
  GetEmailResult,
  GetMailResult,
} from '../interfaces/upstream-adapter.interface';
import { UpstreamException } from '../../../common/exceptions/business.exception';

export class GongXiAdapter implements IUpstreamAdapter {
  private readonly logger = new Logger(GongXiAdapter.name);
  private readonly client: AxiosInstance;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly config: Record<string, any> = {},
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async getEmail(group?: string): Promise<GetEmailResult> {
    try {
      const params: Record<string, string> = {};
      if (group) params.group = group;

      const response = await this.client.get('/api/get-email', { params });
      if (response.data?.success) {
        return response.data.data;
      }
      throw new UpstreamException(response.data?.error?.message || '获取邮箱失败');
    } catch (error) {
      return this.handleError(error, '获取邮箱');
    }
  }

  async getMailNew(email: string, mailbox: string = 'inbox'): Promise<GetMailResult> {
    try {
      const response = await this.client.post('/api/mail_new', { email, mailbox });
      if (response.data?.success) {
        return response.data.data;
      }
      throw new UpstreamException(response.data?.error?.message || '获取邮件失败');
    } catch (error) {
      return this.handleError(error, '获取邮件');
    }
  }

  async getMailText(email: string, match?: string): Promise<string> {
    try {
      const params: Record<string, string> = { email };
      if (match) params.match = match;

      const response = await this.client.post('/api/mail_text', params);
      if (typeof response.data === 'string') {
        if (response.data.startsWith('Error:')) {
          throw new UpstreamException(response.data);
        }
        return response.data;
      }
      if (response.data?.success) {
        return response.data.data;
      }
      return String(response.data);
    } catch (error) {
      return this.handleError(error, '获取验证码');
    }
  }

  async getMailAll(email: string, mailbox: string = 'inbox'): Promise<GetMailResult> {
    try {
      const response = await this.client.post('/api/mail_all', { email, mailbox });
      if (response.data?.success) {
        return response.data.data;
      }
      throw new UpstreamException(response.data?.error?.message || '获取邮件失败');
    } catch (error) {
      return this.handleError(error, '获取全部邮件');
    }
  }

  async clearMailbox(email: string, mailbox: string = 'inbox'): Promise<void> {
    try {
      const response = await this.client.post('/api/process-mailbox', { email, mailbox });
      if (!response.data?.success) {
        throw new UpstreamException(response.data?.error?.message || '清空邮箱失败');
      }
    } catch (error) {
      this.handleError(error, '清空邮箱');
    }
  }

  async listEmails(group?: string): Promise<{ email: string; status: string; group: string | null }[]> {
    try {
      const params: Record<string, string> = {};
      if (group) params.group = group;

      const response = await this.client.get('/api/list-emails', { params });
      if (response.data?.success) {
        return response.data.data.emails;
      }
      throw new UpstreamException('获取邮箱列表失败');
    } catch (error) {
      return this.handleError(error, '获取邮箱列表');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * 统一错误处理 - 返回类型标记为 never，表明此方法总是抛出异常
   */
  private handleError(error: unknown, action: string): never {
    if (error instanceof UpstreamException) {
      throw error;
    }

    const err = error as any;
    const message = err.response?.data?.error?.message
      || err.response?.data?.message
      || err.message
      || `${action}时上游服务异常`;

    this.logger.error(`GongXi API error [${action}]: ${message}`, err.stack);
    throw new UpstreamException(message);
  }
}
