import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { GeocodeSuggestionDto } from '@palmetto/shared';
import { GeocodeService } from './geocode.service';
import { GetGeocodeQuery } from './dto/get-geocode.query';

@Controller()
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get('geocode')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  getSuggestions(@Query() query: GetGeocodeQuery): Observable<GeocodeSuggestionDto[]> {
    return this.geocodeService.getSuggestions$(query.q);
  }
}
