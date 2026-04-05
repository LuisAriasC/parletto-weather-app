import { HourlyDto, Units } from '@parletto/shared';
import { formatTime, degreesToCompass } from '../utils/formatters';

interface HourlyStripProps {
  data: HourlyDto[];
  units: Units;
}

export function HourlyStrip({ data, units }: HourlyStripProps) {
  const slots = data.slice(0, 8);
  const unitSymbol = units === 'imperial' ? '°F' : '°C';
  const speedUnit = units === 'imperial' ? 'mph' : 'm/s';

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-600">
          <th className="pb-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Time</th>
          <th className="pb-2 pr-3" />
          <th className="pb-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Condition</th>
          <th className="pb-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Temp</th>
          <th className="pb-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Rain</th>
          <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Wind</th>
        </tr>
      </thead>
      <tbody>
        {slots.map((slot) => (
          <tr key={slot.time} role="row" className="border-b border-gray-100 dark:border-gray-700 last:border-0">
            <td className="py-2 pr-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {formatTime(slot.time)}
            </td>
            <td className="py-2 pr-3">
              <img
                src={`https://openweathermap.org/img/wn/${slot.conditionIcon}.png`}
                alt={slot.condition}
                className="h-8 w-8"
              />
            </td>
            <td className="py-2 pr-3 capitalize text-gray-700 dark:text-gray-300">
              {slot.condition}
            </td>
            <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
              {Math.round(slot.temperature)}{unitSymbol}
            </td>
            {slot.pop > 0 && (
              <td className="py-2 pr-3 text-blue-500 whitespace-nowrap">
                {Math.round(slot.pop * 100)}%
              </td>
            )}
            {slot.pop === 0 && <td className="py-2 pr-3" />}
            <td className="py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {Math.round(slot.windSpeed)} {speedUnit} {degreesToCompass(slot.windDeg)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
