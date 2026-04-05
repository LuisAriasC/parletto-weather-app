import { X } from 'lucide-react';
import { RecentSearch } from '../store/searchSlice';
import { Button } from '@/components/ui/button';

interface RecentLocationsProps {
  recents: RecentSearch[];
  onSelect: (item: RecentSearch) => void;
  onClear: () => void;
  onRemove: (query: string) => void;
}

export function RecentLocations({ recents, onSelect, onClear, onRemove }: RecentLocationsProps) {
  if (recents.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recent
        </p>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search history"
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear
        </button>
      </div>
      <ul className="space-y-0.5">
        {recents.map((item) => (
          <li key={item.query} className="flex items-center gap-1">
            {item.icon && (
              <img
                src={`https://openweathermap.org/img/wn/${item.icon}.png`}
                alt=""
                aria-hidden="true"
                className="h-6 w-6 flex-shrink-0"
              />
            )}
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {item.label}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(item.query)}
              aria-label={`Remove ${item.label} from recent searches`}
              className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
