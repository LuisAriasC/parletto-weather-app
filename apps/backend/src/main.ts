import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust the first hop (nginx) so req.ip reflects the real client IP,
  // which makes the throttler rate-limit per user rather than per proxy.
  app.set('trust proxy', 1);

  // Disable helmet's CSP — the backend serves JSON APIs + Swagger (not a web app).
  // CSP is enforced by nginx on the React frontend where it matters.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: process.env['ALLOWED_ORIGIN'] ?? 'http://localhost:4200',
    methods: ['GET'],
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: () => new BadRequestException('Invalid request'),
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  if (process.env['NODE_ENV'] !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Parletto Weather API')
      .setDescription('BFF proxy for OpenWeather — current conditions and 5-day forecast')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  console.log(`Backend running at http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
