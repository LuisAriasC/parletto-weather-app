export { SearchBar } from './components/SearchBar';
export { RecentLocations } from './components/RecentLocations';
export { addSearch, removeSearch, clearSearch, updateSearchIcon } from './store/searchSlice';
export { default as searchReducer } from './store/searchSlice';
export type { RecentSearch } from './store/searchSlice';
export { useGeocodeSuggestions } from './hooks/useGeocodeSuggestions';
