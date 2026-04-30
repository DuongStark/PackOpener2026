import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import dotenv from 'dotenv';
import { AppModule } from './app.module';
import { ConfigService } from './core/config/config.service';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.getPort();

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Environment: ${configService.isDevelopment() ? 'Development' : 'Production'}`,
  );
}

bootstrap();
