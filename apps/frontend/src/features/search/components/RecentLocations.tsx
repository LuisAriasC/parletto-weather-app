import { RecentSearch } from '../store/searchSlice';

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
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Recent
        </p>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search history"
          className="text-xs text-gray-400 hover:text-red-400 dark:text-gray-500 dark:hover:text-red-400"
        >
          Clear
        </button>
      </div>
      <ul className="space-y-1">
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
              className="flex-1 truncate rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {item.label}
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.query)}
              aria-label={`Remove ${item.label} from recent searches`}
              className="flex-shrink-0 rounded p-0.5 text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
