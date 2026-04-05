import { Units } from '@parletto/shared';

const COMPASS_POINTS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

export function degreesToCompass(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_POINTS[index];
}

export function formatVisibility(meters: number, units: Units): string {
  if (units === 'imperial') {
    return `${(meters / 1609.34).toFixed(1)} mi`;
  }
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function formatPressure(hpa: number, units: Units): string {
  if (units === 'imperial') {
    return `${(hpa * 0.02953).toFixed(2)} inHg`;
  }
  return `${hpa} hPa`;
}

export function formatPrecipitation(mm: number, units: Units): string {
  if (units === 'imperial') {
    return `${(mm / 25.4).toFixed(2)} in`;
  }
  return `${mm.toFixed(1)} mm`;
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
