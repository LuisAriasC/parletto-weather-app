import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GeocodeSuggestionDto, GEOAPIFY_AUTOCOMPLETE_URL } from '@palmetto/shared';
import { AppConfigService } from '../config/app-config.service';

interface GeoApifyFeature {
  properties: {
    place_id: string;
    formatted: string;
    lat: number;
    lon: number;
  };
}

interface GeoApifyResponse {
  features: GeoApifyFeature[];
}

@Injectable()
export class GeocodeService {
  constructor(
    private readonly httpService: HttpService,
    private readonly appConfig: AppConfigService,
  ) {}

  getSuggestions$(query: string): Observable<GeocodeSuggestionDto[]> {
    return this.httpService
      .get<GeoApifyResponse>(GEOAPIFY_AUTOCOMPLETE_URL, {
        params: { text: query, limit: 5, apiKey: this.appConfig.geoapifyApiKey },
      })
      .pipe(
        map(({ data }) =>
          data.features.map((f) => ({
            placeId: f.properties.place_id,
            label: f.properties.formatted,
            lat: f.properties.lat,
            lon: f.properties.lon,
          })),
        ),
        catchError(() => of([])),
      );
  }
}
