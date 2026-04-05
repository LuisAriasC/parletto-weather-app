import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { SearchBar, RecentLocations, clearSearch, removeSearch } from '../../features/search';
import { RecentSearch } from '../../features/search/store/searchSlice';
import { AutocompleteSelection } from '../../features/search/components/AutocompleteInput';
import { LocationEntry } from '../app';

interface SidebarProps {
  isOpen: boolean;
  onLocationSelect: (entry: LocationEntry) => void;
}

export function Sidebar({ isOpen, onLocationSelect }: SidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const recents = useSelector((s: RootState) => s.search.recents);

  function handleSelect({ label, query }: AutocompleteSelection | RecentSearch) {
    onLocationSelect({ label, query });
  }

  function handleClear() {
    dispatch(clearSearch());
  }

  function handleRemove(query: string) {
    dispatch(removeSearch(query));
  }

  return (
    <aside
      className={`w-60 flex-shrink-0 border-r border-border bg-muted/40 p-4 ${
        isOpen ? 'block' : 'hidden'
      } md:block`}
    >
      <SearchBar onSearch={handleSelect} />
      <RecentLocations
        recents={recents}
        onSelect={handleSelect}
        onClear={handleClear}
        onRemove={handleRemove}
      />
    </aside>
  );
}
