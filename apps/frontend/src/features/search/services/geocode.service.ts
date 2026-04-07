import axios from 'axios';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GeocodeSuggestionDto } from '@palmetto/shared';

const API_BASE = import.meta.env['VITE_API_BASE_URL'] ?? '/api';

export const geocodeService = {
  getSuggestions$(query: string): Observable<GeocodeSuggestionDto[]> {
    return from(
      axios.get<GeocodeSuggestionDto[]>(`${API_BASE}/geocode`, {
        params: { q: query },
      }),
    ).pipe(map((response) => response.data));
  },
};
