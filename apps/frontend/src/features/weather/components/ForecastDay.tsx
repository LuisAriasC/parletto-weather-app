import { ForecastDto, Units } from '@parletto/shared';
import { Card, CardContent } from '@/components/ui/card';

interface ForecastDayProps {
  data: ForecastDto;
  units: Units;
}

export function ForecastDay({ data, units }: ForecastDayProps) {
  const unitSymbol = units === 'imperial' ? '°F' : '°C';
  const dayLabel = new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <Card className="items-center gap-0">
      <CardContent className="flex flex-col items-center gap-1 px-3 py-3">
        <span className="text-xs font-medium text-muted-foreground">{dayLabel}</span>
        <img
          src={`https://openweathermap.org/img/wn/${data.conditionIcon}.png`}
          alt={data.condition}
          className="h-10 w-10"
        />
        <span className="text-sm font-semibold text-foreground">
          {Math.round(data.high)}{unitSymbol}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(data.low)}{unitSymbol}
        </span>
      </CardContent>
    </Card>
  );
}
