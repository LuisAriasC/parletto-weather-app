import { useState } from 'react';
import { AutocompleteInput, AutocompleteSelection } from './AutocompleteInput';

interface SearchBarProps {
  onSearch: (selection: AutocompleteSelection) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [error, setError] = useState('');

  function handleSelect(sel: AutocompleteSelection) {
    if (!sel.label.trim()) {
      setError('Please enter a city name.');
      return;
    }
    setError('');
    onSearch(sel);
  }

  return (
    <div className="w-full">
      <AutocompleteInput onSelect={handleSelect} placeholder="Search city or zip..." />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
