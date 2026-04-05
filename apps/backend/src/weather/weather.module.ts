import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherMapper } from './weather.mapper';
import { MetricsService } from './metrics.service';
import { AppConfigService } from '../config/app-config.service';

@Module({
  imports: [HttpModule],
  controllers: [WeatherController],
  providers: [WeatherService, WeatherMapper, MetricsService, AppConfigService],
  exports: [MetricsService],
})
export class WeatherModule {}
