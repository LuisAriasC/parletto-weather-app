import { ForecastDto, Units } from '@palmetto/shared';
import { ForecastDay } from './ForecastDay';

interface ForecastStripProps {
  data: ForecastDto[];
  units: Units;
}

export function ForecastStrip({ data, units }: ForecastStripProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        5-Day Forecast
      </p>
      <div className="grid grid-cols-5 gap-2">
        {data.map((day) => (
          <ForecastDay key={day.date} data={day} units={units} />
        ))}
      </div>
    </div>
  );
}
