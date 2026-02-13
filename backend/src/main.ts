import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

function parseBooleanFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  const jwtSecret = configService.get<string>('JWT_SECRET');
  const jwtAdminSecret = configService.get<string>('JWT_ADMIN_SECRET');

  if (!jwtSecret || jwtSecret.includes('your_') || jwtSecret.length < 32) {
    if (nodeEnv === 'production') {
      throw new Error('JWT_SECRET is required and must be at least 32 characters in production.');
    }
    logger.warn(
      'JWT_SECRET is using a placeholder value. Replace it before production deployment.',
    );
  }

  if (!jwtAdminSecret || jwtAdminSecret.includes('your_') || jwtAdminSecret.length < 32) {
    if (nodeEnv === 'production') {
      throw new Error(
        'JWT_ADMIN_SECRET is required and must be at least 32 characters in production.',
      );
    }
    logger.warn(
      'JWT_ADMIN_SECRET is using a placeholder value. Replace it before production deployment.',
    );
  }

  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: nodeEnv === 'production' ? (corsOrigin ? corsOrigin.split(',') : false) : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerEnabled = parseBooleanFlag(
    configService.get<string>('SWAGGER_ENABLED'),
    nodeEnv !== 'production',
  );

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Email Platform API')
      .setDescription('Backend API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document);
  }

  await app.listen(port);
  logger.log(`Server running on http://localhost:${port} [${nodeEnv}]`);
  if (swaggerEnabled) {
    logger.log(`Swagger docs: http://localhost:${port}/api-docs`);
  }
}

bootstrap();
