import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeocodeController } from './geocode.controller';
import { GeocodeService } from './geocode.service';
import { AppConfigService } from '../config/app-config.service';

@Module({
  imports: [HttpModule],
  controllers: [GeocodeController],
  providers: [GeocodeService, AppConfigService],
})
export class GeocodeModule {}
