import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ExceptionPayload {
  message?: string | string[];
  code?: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = 'INTERNAL_ERROR';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object') {
        const res = exResponse as ExceptionPayload;
        let resolvedCode = res.code || this.getCodeFromStatus(status);

        if (Array.isArray(res.message)) {
          message = res.message.join('; ');
          if (!res.code) {
            resolvedCode = 'VALIDATION_ERROR';
          }
        } else if (typeof res.message === 'string') {
          message = res.message;
        } else {
          message = exception.message;
        }
        code = resolvedCode;
        details = res.details;
      }
    } else if (exception instanceof Error) {
      // 生产环境不泄露内部错误信息
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      if (!this.isProduction) {
        message = exception.message;
      }
      // 生产环境保持默认 message = '服务器内部错误'
    }

    response.status(status).json({
      success: false,
      code,
      message,
      details: this.isProduction ? undefined : details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getCodeFromStatus(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMIT_EXCEEDED',
    };
    return map[status] || 'INTERNAL_ERROR';
  }
}
