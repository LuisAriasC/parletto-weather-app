import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AppConfigService } from '../config/app-config.service';
import { MetricsService } from '../weather/metrics.service';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly metrics: MetricsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Service health and runtime metrics' })
  @ApiResponse({ status: 200, description: 'Health status and cache metrics' })
  check() {
    return {
      status: 'ok',
      apiKeyConfigured: !!this.appConfig.apiKey,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      metrics: this.metrics.getMetrics(),
    };
  }
}
