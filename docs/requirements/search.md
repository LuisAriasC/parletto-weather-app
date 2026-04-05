# Search & Autocomplete Requirements

## Functional Requirements

### City Search
- [x] User can type a city name into a search input
- [x] Pressing Enter submits the search and loads weather data
- [x] Empty search shows a validation message ("Please enter a city name")
- [x] Invalid city shows an error alert

### Autocomplete
- [x] Typing 3+ characters triggers autocomplete suggestions from GeoApify
- [x] Suggestions appear in a dropdown with `role="listbox"`
- [x] Input is debounced by 300ms to avoid excessive API calls
- [x] User can navigate suggestions with Arrow Up / Arrow Down keys
- [x] Pressing Enter selects the highlighted suggestion
- [x] Clicking a suggestion selects it
- [x] Pressing Escape closes the dropdown without triggering a search
- [x] Selected suggestion uses coordinates (lat/lon) for weather lookup, not city name text
- [x] Selected suggestion displays a human-readable label, not raw coordinates
- [x] Show a loading indicator while autocomplete suggestions are being fetched
- [x] Handle the case where GeoApify returns no results (show "No results found" in dropdown)

### Recent Searches
- [x] Last 5 searches are saved in the sidebar
- [x] Clicking a recent search re-fetches weather for that location
- [x] Recent searches persist across page reloads (localStorage)
- [x] Duplicate searches are deduplicated (most recent moves to top)
- [x] A "Clear" button removes all recent searches
- [x] Recent searches display human-readable labels, not coordinate strings
- [x] Allow removing individual recent searches (not just clear all)
- [x] Show the weather condition icon next to each recent search
