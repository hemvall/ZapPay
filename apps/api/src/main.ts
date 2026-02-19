import './instrument'; // MUST be first import — initializes Sentry

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.enableCors({
    origin:
      process.env['NODE_ENV'] === 'production'
        ? [process.env['PAYMENT_LINK_BASE_URL'] ?? '']
        : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH'],
  });

  const port = parseInt(process.env['PORT'] ?? '3001', 10);
  await app.listen(port);
}

void bootstrap();
