import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { GeocodeSuggestionDto } from '@parletto/shared';
import { useGeocodeSuggestions } from '../hooks/useGeocodeSuggestions';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(value), 300);
    return () => clearTimeout(t);
  }, [value]);

  const { data: suggestions = [], isLoading } = useGeocodeSuggestions(debouncedQuery);

  const valueLongEnough = value.trim().length >= 3;
  const showDropdown = open && (isLoading || (valueLongEnough && suggestions.length === 0) || suggestions.length > 0);

  function clear() {
    setValue('');
    setDebouncedQuery('');
    setOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  function selectSuggestion(s: GeocodeSuggestionDto) {
    setValue('');
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
        setValue('');
        onSelect({ label: value, query: value });
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  }

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
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
        className={cn('w-full', value && 'pr-8')}
      />
      {value && (
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); clear(); }}
          aria-label="Clear search input"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
      {showDropdown && (
        <ul
          role="listbox"
          aria-busy={isLoading}
          className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-md"
        >
          {isLoading && (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <span
                aria-hidden="true"
                className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
              />
              Loading…
            </li>
          )}
          {!isLoading && valueLongEnough && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No results found
            </li>
          )}
          {!isLoading && suggestions.map((s, i) => (
            <li
              key={s.placeId}
              role="option"
              aria-selected={i === highlightedIndex}
              onMouseDown={() => selectSuggestion(s)}
              className={cn(
                'cursor-pointer px-3 py-2 text-sm transition-colors',
                i === highlightedIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
