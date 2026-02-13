import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(code: string, message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({ code, message }, status);
  }
}

export class InsufficientBalanceException extends BusinessException {
  constructor() {
    super('INSUFFICIENT_BALANCE', '余额不足', HttpStatus.PAYMENT_REQUIRED);
  }
}

export class NoAvailableEmailException extends BusinessException {
  constructor() {
    super('NO_AVAILABLE_EMAIL', '没有可用的邮箱', HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class UpstreamException extends BusinessException {
  constructor(message: string = '上游服务异常') {
    super('UPSTREAM_ERROR', message, HttpStatus.BAD_GATEWAY);
  }
}
