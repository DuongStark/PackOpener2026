import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './core/config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Lấy ConfigService từ app context
  const configService = app.get(ConfigService);
  const port = configService.getPort();
  
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📝 Environment: ${configService.isDevelopment() ? 'Development' : 'Production'}`);
}
bootstrap();
