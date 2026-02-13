import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeyService } from '../modules/api-key/api-key.service';
import { ApiGatewayRequest } from './gateway.types';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiGatewayRequest>();

    const apiKey = this.extractApiKey(request);
    if (!apiKey) {
      throw new UnauthorizedException('缺少 API Key，请在 x-api-key 请求头中提供');
    }

    const keyInfo = await this.apiKeyService.validateApiKey(apiKey);
    if (!keyInfo) {
      throw new UnauthorizedException('无效的 API Key');
    }

    const allowed = await this.apiKeyService.checkRateLimit(keyInfo.apiKeyId, keyInfo.rateLimit);
    if (!allowed) {
      throw new HttpException('请求频率超限', HttpStatus.TOO_MANY_REQUESTS);
    }

    request.apiKeyUser = keyInfo;

    return true;
  }

  /**
   * 提取 API Key - 仅从 Header 中获取，不支持查询参数（防止泄露到日志/Referer）
   */
  private extractApiKey(request: ApiGatewayRequest): string | null {
    // 1. Header: x-api-key
    const apiKeyHeader = this.firstHeaderValue(request.headers['x-api-key']);
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // 2. Header: Authorization: Bearer sk_xxx
    const auth = this.firstHeaderValue(request.headers.authorization);
    if (auth?.startsWith('Bearer sk_')) {
      return auth.substring(7);
    }

    return null;
  }

  private firstHeaderValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }
}
