import { WeatherDto } from '@palmetto/shared';
import { Card, CardContent } from '@/components/ui/card';
import { StatTile } from './StatTile';
import {
  degreesToCompass,
  formatVisibility,
  formatPressure,
  formatPrecipitation,
  formatTime,
} from '../utils/formatters';

interface CurrentWeatherProps {
  data: WeatherDto;
}

export function CurrentWeather({ data }: CurrentWeatherProps) {
  const unitSymbol = data.units === 'imperial' ? '°F' : '°C';
  const speedUnit = data.units === 'imperial' ? 'mph' : 'm/s';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {data.city}, {data.country}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-6xl font-light text-foreground">
                {Math.round(data.temperature)}
              </span>
              <span className="text-2xl text-muted-foreground">{unitSymbol}</span>
            </div>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              {data.condition}
            </p>
            <p className="text-xs text-muted-foreground">
              Feels like {Math.round(data.feelsLike)}{unitSymbol}
            </p>
          </div>
          <img
            src={`https://openweathermap.org/img/wn/${data.conditionIcon}@2x.png`}
            alt={data.condition}
            className="h-16 w-16"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <StatTile label="Humidity" value={`${data.humidity}%`} />
          <StatTile
            label="Wind"
            value={`${Math.round(data.windSpeed)} ${speedUnit} ${degreesToCompass(data.windDeg)}`}
          />
          {data.windGust !== null && (
            <StatTile label="Gust" value={`${Math.round(data.windGust)} ${speedUnit}`} />
          )}
          <StatTile label="UV Index" value={String(data.uvIndex)} />
          <StatTile label="High" value={`${Math.round(data.high)}${unitSymbol}`} />
          <StatTile label="Low" value={`${Math.round(data.low)}${unitSymbol}`} />
          <StatTile label="Visibility" value={formatVisibility(data.visibility, data.units)} />
          <StatTile label="Pressure" value={formatPressure(data.pressure, data.units)} />
          <StatTile label="Clouds" value={`${data.cloudCoverage}%`} />
          {data.precipitation > 0 && (
            <StatTile label="Precip" value={formatPrecipitation(data.precipitation, data.units)} />
          )}
          <StatTile label="Sunrise" value={formatTime(data.sunrise)} />
          <StatTile label="Sunset" value={formatTime(data.sunset)} />
        </div>
      </CardContent>
    </Card>
  );
}
