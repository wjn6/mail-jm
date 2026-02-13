import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // JWT Secret 启动校验
  const jwtSecret = configService.get<string>('JWT_SECRET');
  const jwtAdminSecret = configService.get<string>('JWT_ADMIN_SECRET');

  if (!jwtSecret || jwtSecret.includes('your_') || jwtSecret.length < 32) {
    if (nodeEnv === 'production') {
      throw new Error('生产环境必须设置安全的 JWT_SECRET（至少32位随机字符串）');
    }
    logger.warn('⚠️ JWT_SECRET 使用了默认占位值，请在生产环境替换为安全的随机字符串');
  }

  if (!jwtAdminSecret || jwtAdminSecret.includes('your_') || jwtAdminSecret.length < 32) {
    if (nodeEnv === 'production') {
      throw new Error('生产环境必须设置安全的 JWT_ADMIN_SECRET（至少32位随机字符串）');
    }
    logger.warn('⚠️ JWT_ADMIN_SECRET 使用了默认占位值，请在生产环境替换为安全的随机字符串');
  }

  // CORS - 生产环境限制来源
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: nodeEnv === 'production'
      ? (corsOrigin ? corsOrigin.split(',') : false)
      : true,
    credentials: true,
  });

  // 全局管道 - 参数校验
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应格式化拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger 文档 (仅非生产环境)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('邮箱接码平台 API')
      .setDescription('邮箱接码平台后端 API 文档')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document);
  }

  await app.listen(port);
  logger.log(`🚀 Server running on http://localhost:${port} [${nodeEnv}]`);
  if (nodeEnv !== 'production') {
    logger.log(`📖 Swagger docs: http://localhost:${port}/api-docs`);
  }
}
bootstrap();
