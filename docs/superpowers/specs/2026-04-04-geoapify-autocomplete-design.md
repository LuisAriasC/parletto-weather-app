# GeoApify Autocomplete Design

## Goal

Replace the plain text search input with an autocomplete dropdown powered by the GeoApify Geocoding API. When the user selects a suggestion, weather is fetched by coordinates (`lat,lon`) for precision. Human-readable place names are shown in the input and in recent searches.

## Architecture

GeoApify calls are proxied through the NestJS BFF — the API key never reaches the browser, consistent with the existing OpenWeather pattern. The backend already handles `"lat,lon"` strings in `buildLocationParams()`, so no changes are needed to weather fetching logic.

Recent searches change from `string[]` to `{ label: string; query: string }[]` to store both the human-readable name and the coordinate query string.

---

## Data Flow

```
User types in AutocompleteInput
  → debounced (300ms), enabled when query ≥ 2 chars
  → useGeocodeSuggestions(query) [React Query]
    → GET /api/geocode?q={query}  [NestJS BFF]
      → GET https://api.geoapify.com/v1/geocode/autocomplete?text={query}&apiKey={key}
      ← [{ place_id, formatted, lat, lon }]
    ← GeocodeSuggestionDto[]
  → dropdown renders suggestion labels
User selects a suggestion
  → AutocompleteInput calls onSelect({ label, query: "lat,lon" })
  → SearchBar calls onSearch({ label, query })
  → Sidebar dispatches addSearch({ label, query }) → Redux + localStorage
  → onLocationSelect("lat,lon") → existing weather fetch pipeline
```

---

## Shared DTO

**New file:** `libs/shared/src/types/geocode.dto.ts`

```typescript
export interface GeocodeSuggestionDto {
  placeId: string;
  label: string;   // formatted place name for display
  lat: number;
  lon: number;
}
```

Export from `libs/shared/src/index.ts`.

---

## Backend

### Environment

`.env.example` and `.env` get a new variable:
```
GEOAPIFY_API_KEY=your_geoapify_api_key_here
```

The typed config factory (`apps/backend/src/config/`) is extended to expose `geoapifyApiKey: string`.

### New module: `apps/backend/src/geocode/`

**`geocode.controller.ts`**
- `GET /api/geocode?q=...` — throttled (20 req / 60s)
- Validates `q` is a non-empty string (min length 2)
- Returns `GeocodeSuggestionDto[]`

**`geocode.service.ts`**
- Injects `HttpService` and typed config
- Calls `https://api.geoapify.com/v1/geocode/autocomplete?text={q}&limit=5&apiKey={key}`
- Maps each feature to `GeocodeSuggestionDto { placeId, label: properties.formatted, lat: geometry.coordinates[1], lon: geometry.coordinates[0] }`
- Returns empty array on empty results or HTTP error (no thrown exceptions — graceful degradation)

**`geocode.module.ts`**
- Imports `HttpModule`, provides `GeocodeService`, exports nothing

**`AppModule`** imports `GeocodeModule`.

---

## Frontend

### Hook: `useGeocodeSuggestions`

**New file:** `apps/frontend/src/features/search/hooks/useGeocodeSuggestions.ts`

```typescript
useGeocodeSuggestions(query: string): UseQueryResult<GeocodeSuggestionDto[], ErrorDto>
```

- React Query, `queryKey: ['geocode', query]`
- `enabled: query.trim().length >= 2`
- `staleTime: 5 * 60 * 1000` (5 min — suggestions don't change often)
- `retry: 0` — don't retry geocode failures; just show no suggestions
- Calls `GET /api/geocode?q={query}` via axios

### Component: `AutocompleteInput`

**New file:** `apps/frontend/src/features/search/components/AutocompleteInput.tsx`

Props:
```typescript
interface AutocompleteInputProps {
  onSelect: (selection: { label: string; query: string }) => void;
  placeholder?: string;
}
```

Behaviour:
- Controlled input with local `value` state
- Debounces input (300ms) before triggering `useGeocodeSuggestions`
- Renders a dropdown list of suggestions below the input when data is available and input is focused
- Keyboard navigation: ↑/↓ moves highlight, Enter confirms highlighted item, Esc closes dropdown and clears highlight
- Clicking a suggestion calls `onSelect({ label: suggestion.label, query: `${suggestion.lat},${suggestion.lon}` })`
- After selection, sets input value to `suggestion.label` and closes dropdown
- Dropdown closes on outside click (blur)
- Shows no suggestions when query < 2 chars or when the hook returns empty array

### Component: `SearchBar` (modified)

- Replaces `<input>` with `<AutocompleteInput onSelect={handleSelect} />`
- `handleSelect` calls `onSearch({ label, query })` where `onSearch` signature changes to accept `{ label: string; query: string }`
- Empty-submit validation stays: if no selection has been made and input is blank, show "Please enter a city name."

### Redux: `searchSlice` (modified)

`recents` changes from `string[]` to `{ label: string; query: string }[]`.

- `addSearch` payload becomes `{ label: string; query: string }`
- Deduplication by `query` (not label)
- Max 5 entries — same as before
- `localStorage` key `recents` now stores the new shape

### Component: `RecentLocations` (modified)

- Renders `r.label` as the button text (human-readable)
- Calls `onSelect(r.query)` (coordinates string) when clicked

### Component: `Sidebar` (modified)

```typescript
function handleSearch({ label, query }: { label: string; query: string }) {
  dispatch(addSearch({ label, query }));
  onLocationSelect(query);   // passes "lat,lon" to weather fetch
}
```

`SearchBar`'s `onSearch` prop type updated to `(selection: { label: string; query: string }) => void`.

---

## Error Handling

- If GeoApify returns no results, the dropdown simply does not appear — no error message shown.
- If the geocode request fails (network error, bad key), the dropdown does not appear. The user can still press Enter to search by whatever they typed (falls back to city-name search via `q` param).
- The backend `GeocodeService` catches HTTP errors and returns an empty array rather than propagating a 500.

---

## Testing

### Backend

**`geocode.service.spec.ts`**
- Mocks `HttpService.get()`, verifies call to correct GeoApify URL with `q` and `apiKey` params
- Maps GeoJSON feature response to `GeocodeSuggestionDto[]` correctly
- Returns empty array when GeoApify returns empty `features`
- Returns empty array when HTTP request throws

**`geocode.controller.spec.ts`**
- Calls `GeocodeService.getSuggestions(q)` and returns result

### Frontend

**`AutocompleteInput.spec.tsx`**
- Renders suggestions when hook returns data
- Keyboard: ↓ highlights first item, ↑ wraps, Enter calls `onSelect`, Esc closes dropdown
- Clicking a suggestion calls `onSelect` with correct `{ label, query }`
- Does not render dropdown when query < 2 chars
- Does not render dropdown when hook returns empty array

**`SearchBar.spec.tsx`** (updated)
- Selecting an autocomplete item calls `onSearch` with `{ label, query }`
- Submitting empty input still shows validation error

**`searchSlice.spec.ts`** (updated)
- `addSearch({ label, query })` stores object, not string
- Deduplication uses `query` field
- Max-5 cap still enforced

**`RecentLocations.spec.tsx`** (updated)
- Renders `label` text in each button
- Calls `onSelect` with `query` value, not `label`

### E2E (Playwright)

- Typing 3+ chars shows autocomplete dropdown with suggestions
- Clicking a suggestion triggers weather card for that location
- Selected location appears in recents sidebar with human-readable label
- Pressing Esc closes the dropdown without triggering search
