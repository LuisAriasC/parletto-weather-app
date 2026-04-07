import { HourlyDto, Units } from '@palmetto/shared';
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
        <tr className="border-b border-border">
          <th className="pb-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</th>
          <th className="pb-2 pr-3" />
          <th className="pb-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</th>
          <th className="pb-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Temp</th>
          <th className="pb-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rain</th>
          <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wind</th>
        </tr>
      </thead>
      <tbody>
        {slots.map((slot) => (
          <tr key={slot.time} role="row" className="border-b border-border/50 last:border-0">
            <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
              {formatTime(slot.time)}
            </td>
            <td className="py-2 pr-3">
              <img
                src={`https://openweathermap.org/img/wn/${slot.conditionIcon}.png`}
                alt={slot.condition}
                className="h-8 w-8"
              />
            </td>
            <td className="py-2 pr-3 capitalize text-foreground">
              {slot.condition}
            </td>
            <td className="py-2 pr-3 font-medium text-foreground whitespace-nowrap">
              {Math.round(slot.temperature)}{unitSymbol}
            </td>
            {slot.pop > 0 && (
              <td className="py-2 pr-3 text-primary whitespace-nowrap">
                {Math.round(slot.pop * 100)}%
              </td>
            )}
            {slot.pop === 0 && <td className="py-2 pr-3" />}
            <td className="py-2 text-muted-foreground whitespace-nowrap">
              {Math.round(slot.windSpeed)} {speedUnit} {degreesToCompass(slot.windDeg)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
