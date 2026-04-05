import { useState, useEffect } from 'react';
import { GeocodeSuggestionDto } from '@parletto/shared';
import { useGeocodeSuggestions } from '../hooks/useGeocodeSuggestions';

export interface AutocompleteSelection {
  label: string;
  query: string;
}

interface AutocompleteInputProps {
  onSelect: (selection: AutocompleteSelection) => void;
  placeholder?: string;
}

export function AutocompleteInput({ onSelect, placeholder }: AutocompleteInputProps) {
  const [value, setValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(value), 300);
    return () => clearTimeout(t);
  }, [value]);

  const { data: suggestions = [], isLoading } = useGeocodeSuggestions(debouncedQuery);

  const valueLongEnough = value.trim().length >= 3;
  const showDropdown = open && (isLoading || (valueLongEnough && suggestions.length === 0) || suggestions.length > 0);

  function selectSuggestion(s: GeocodeSuggestionDto) {
    setValue(s.label);
    setOpen(false);
    setHighlightedIndex(-1);
    onSelect({ label: s.label, query: `${s.lat},${s.lon}` });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && highlightedIndex >= 0) {
        selectSuggestion(suggestions[highlightedIndex]);
      } else {
        setOpen(false);
        onSelect({ label: value, query: value });
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setHighlightedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
      />
      {showDropdown && (
        <ul
          role="listbox"
          aria-busy={isLoading}
          className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          {isLoading && (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
              <span
                aria-hidden="true"
                className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-400"
              />
              Loading…
            </li>
          )}
          {!isLoading && valueLongEnough && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
              No results found
            </li>
          )}
          {!isLoading && suggestions.map((s, i) => (
            <li
              key={s.placeId}
              role="option"
              aria-selected={i === highlightedIndex}
              onMouseDown={() => selectSuggestion(s)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === highlightedIndex
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
