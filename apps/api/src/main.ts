import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { loadAppConfig } from './config/app.config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = loadAppConfig();
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

  app.enableCors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  });

  await app.listen(config.port);
  logger.log(`Application running on port ${config.port} (${config.nodeEnv})`);
}

bootstrap();
