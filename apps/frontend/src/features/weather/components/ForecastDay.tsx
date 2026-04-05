import { ForecastDto, Units } from '@parletto/shared';

interface ForecastDayProps {
  data: ForecastDto;
  units: Units;
}

export function ForecastDay({ data, units }: ForecastDayProps) {
  const unitSymbol = units === 'imperial' ? '°F' : '°C';
  const dayLabel = new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-100 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{dayLabel}</span>
      <img
        src={`https://openweathermap.org/img/wn/${data.conditionIcon}.png`}
        alt={data.condition}
        className="h-10 w-10"
      />
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {Math.round(data.high)}{unitSymbol}
      </span>
      <span className="text-xs text-gray-400">
        {Math.round(data.low)}{unitSymbol}
      </span>
    </div>
  );
}
