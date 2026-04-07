import { Injectable } from '@nestjs/common';
import { WeatherDto, ForecastDto, HourlyDto, Units } from '@palmetto/shared';

export interface OpenWeatherCurrentResponse {
  name: string;
  sys: { country: string; sunrise: number; sunset: number };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_max: number;
    temp_min: number;
    pressure: number;
  };
  wind: { speed: number; deg: number; gust?: number };
  weather: Array<{ description: string; icon: string }>;
  uvi?: number;
  dt: number;
  visibility: number;
  clouds: { all: number };
  rain?: { '1h'?: number };
  snow?: { '1h'?: number };
}

export interface OpenWeatherForecastSlot {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    temp_max: number;
    temp_min: number;
    humidity: number;
    feels_like: number;
  };
  wind: { speed: number; deg: number };
  weather: Array<{ description: string; icon: string }>;
  pop?: number;
}

export interface OpenWeatherForecastResponse {
  list: OpenWeatherForecastSlot[];
}

@Injectable()
export class WeatherMapper {
  toWeatherDto(raw: OpenWeatherCurrentResponse, units: Units): WeatherDto {
    return {
      city: raw.name,
      country: raw.sys.country,
      temperature: raw.main.temp,
      feelsLike: raw.main.feels_like,
      humidity: raw.main.humidity,
      windSpeed: raw.wind.speed,
      windDeg: raw.wind.deg,
      windGust: raw.wind.gust ?? null,
      uvIndex: raw.uvi ?? 0,
      condition: raw.weather[0]?.description ?? '',
      conditionIcon: raw.weather[0]?.icon ?? '',
      high: raw.main.temp_max,
      low: raw.main.temp_min,
      units,
      updatedAt: new Date(raw.dt * 1000).toISOString(),
      visibility: raw.visibility,
      pressure: raw.main.pressure,
      cloudCoverage: raw.clouds.all,
      precipitation: raw.rain?.['1h'] ?? raw.snow?.['1h'] ?? 0,
      sunrise: new Date(raw.sys.sunrise * 1000).toISOString(),
      sunset: new Date(raw.sys.sunset * 1000).toISOString(),
    };
  }

  toForecastDtos(raw: OpenWeatherForecastResponse): ForecastDto[] {
    const byDay = new Map<string, OpenWeatherForecastSlot[]>();

    for (const slot of raw.list) {
      const day = slot.dt_txt.split(' ')[0]; // 'YYYY-MM-DD'
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(slot);
    }

    return Array.from(byDay.entries())
      .slice(0, 5)
      .map(([day, slots]) => ({
        date: new Date(day).toISOString(),
        high: Math.max(...slots.map((s) => s.main.temp_max)),
        low: Math.min(...slots.map((s) => s.main.temp_min)),
        condition: this.dominantCondition(slots).description,
        conditionIcon: this.dominantCondition(slots).icon,
        humidity: Math.round(
          slots.reduce((sum, s) => sum + s.main.humidity, 0) / slots.length,
        ),
        windSpeed: Math.round(
          slots.reduce((sum, s) => sum + s.wind.speed, 0) / slots.length,
        ),
      }));
  }

  toHourlyDtos(raw: OpenWeatherForecastResponse): HourlyDto[] {
    return raw.list.map((slot) => ({
      time: new Date(slot.dt * 1000).toISOString(),
      temperature: slot.main.temp,
      feelsLike: slot.main.feels_like,
      condition: slot.weather[0]?.description ?? '',
      conditionIcon: slot.weather[0]?.icon ?? '',
      humidity: slot.main.humidity,
      windSpeed: slot.wind.speed,
      windDeg: slot.wind.deg,
      pop: slot.pop ?? 0,
    }));
  }

  private dominantCondition(
    slots: OpenWeatherForecastSlot[],
  ): { description: string; icon: string } {
    const counts = new Map<string, number>();
    for (const slot of slots) {
      const icon = slot.weather[0]?.icon ?? '';
      counts.set(icon, (counts.get(icon) ?? 0) + 1);
    }
    const dominantIcon = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const dominantSlot = slots.find((s) => s.weather[0]?.icon === dominantIcon)!;
    return {
      description: dominantSlot.weather[0]?.description ?? '',
      icon: dominantIcon,
    };
  }
}
