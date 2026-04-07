import axios, { AxiosError } from 'axios';
import { from, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { WeatherDto, ForecastDto, HourlyDto, Units, ErrorDto } from '@palmetto/shared';

const API_BASE = import.meta.env['VITE_API_BASE_URL'] ?? '/api';

function isErrorDto(data: unknown): data is ErrorDto {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>)['statusCode'] === 'number' &&
    typeof (data as Record<string, unknown>)['message'] === 'string' &&
    typeof (data as Record<string, unknown>)['error'] === 'string'
  );
}

function normalizeError(err: unknown): ErrorDto {
  if (err instanceof AxiosError && err.response) {
    const data = err.response.data;
    if (isErrorDto(data)) return data;
  }
  return { statusCode: 500, message: 'Unexpected error', error: 'Error' };
}

export const weatherService = {
  getWeather$(location: string, units: Units): Observable<WeatherDto> {
    return from(
      axios.get<WeatherDto>(`${API_BASE}/weather`, {
        params: { location, units },
      }),
    ).pipe(
      map((response) => response.data),
      catchError((err) => throwError(() => normalizeError(err))),
    );
  },

  getForecast$(location: string, units: Units): Observable<ForecastDto[]> {
    return from(
      axios.get<ForecastDto[]>(`${API_BASE}/forecast`, {
        params: { location, units },
      }),
    ).pipe(
      map((response) => response.data),
      catchError((err) => throwError(() => normalizeError(err))),
    );
  },

  getHourlyForecast$(location: string, units: Units): Observable<HourlyDto[]> {
    return from(
      axios.get<HourlyDto[]>(`${API_BASE}/forecast/hourly`, {
        params: { location, units },
      }),
    ).pipe(
      map((response) => response.data),
      catchError((err) => throwError(() => normalizeError(err))),
    );
  },
};
