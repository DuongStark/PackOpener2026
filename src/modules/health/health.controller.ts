import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check() {
    const isDbConnected = await this.healthService.checkDatabase();

    if (!isDbConnected) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        message: 'Database unreachable',
      });
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}
