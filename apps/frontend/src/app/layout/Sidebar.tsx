import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { SearchBar, RecentLocations, addSearch, clearSearch, removeSearch } from '../../features/search';
import { RecentSearch } from '../../features/search/store/searchSlice';
import { AutocompleteSelection } from '../../features/search/components/AutocompleteInput';

interface SidebarProps {
  isOpen: boolean;
  onLocationSelect: (location: string) => void;
}

export function Sidebar({ isOpen, onLocationSelect }: SidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const recents = useSelector((s: RootState) => s.search.recents);

  function handleSelect({ label, query }: AutocompleteSelection | RecentSearch) {
    dispatch(addSearch({ label, query }));
    onLocationSelect(query);
  }

  function handleClear() {
    dispatch(clearSearch());
  }

  function handleRemove(query: string) {
    dispatch(removeSearch(query));
  }

  return (
    <aside
      className={`w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 ${
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
