import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { WeatherDto, ForecastDto, HourlyDto } from '@palmetto/shared';
import { WeatherService } from './weather.service';
import { GetWeatherQuery } from './dto/get-weather.query';

@ApiTags('weather')
@Controller()
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('weather')
  @Throttle({ default: { ttl: 60_000, limit: 100 } })
  @ApiOperation({ summary: 'Get current weather for a location' })
  @ApiQuery({ name: 'location', description: 'City name (e.g. "Austin") or lat,lon (e.g. "30.27,-97.74")', required: true })
  @ApiQuery({ name: 'units', enum: ['imperial', 'metric'], required: false })
  @ApiResponse({ status: 200, description: 'Current weather data' })
  @ApiResponse({ status: 400, description: 'Invalid or missing location' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 502, description: 'Weather service unavailable' })
  getWeather(@Query() query: GetWeatherQuery): Observable<WeatherDto> {
    return this.weatherService.getWeather$(query.location, query.units ?? 'imperial');
  }

  @Get('forecast')
  @Throttle({ default: { ttl: 60_000, limit: 100 } })
  @ApiOperation({ summary: 'Get 5-day forecast for a location' })
  @ApiQuery({ name: 'location', description: 'City name (e.g. "Austin") or lat,lon (e.g. "30.27,-97.74")', required: true })
  @ApiQuery({ name: 'units', enum: ['imperial', 'metric'], required: false })
  @ApiResponse({ status: 200, description: '5-day daily forecast' })
  @ApiResponse({ status: 400, description: 'Invalid or missing location' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 502, description: 'Weather service unavailable' })
  getForecast(@Query() query: GetWeatherQuery): Observable<ForecastDto[]> {
    return this.weatherService.getForecast$(query.location, query.units ?? 'imperial');
  }

  @Get('forecast/hourly')
  @Throttle({ default: { ttl: 60_000, limit: 100 } })
  @ApiOperation({ summary: 'Get 3-hour interval forecast (40 slots / 5 days)' })
  @ApiQuery({ name: 'location', required: true })
  @ApiQuery({ name: 'units', enum: ['imperial', 'metric'], required: false })
  @ApiResponse({ status: 200, description: '40 slots at 3-hour intervals' })
  @ApiResponse({ status: 400, description: 'Invalid or missing location' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 502, description: 'Weather service unavailable' })
  getHourlyForecast(@Query() query: GetWeatherQuery): Observable<HourlyDto[]> {
    return this.weatherService.getHourlyForecast$(query.location, query.units ?? 'imperial');
  }
}
