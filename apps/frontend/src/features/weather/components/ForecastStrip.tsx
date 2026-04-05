import { ForecastDto, Units } from '@parletto/shared';
import { ForecastDay } from './ForecastDay';

interface ForecastStripProps {
  data: ForecastDto[];
  units: Units;
}

export function ForecastStrip({ data, units }: ForecastStripProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
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
