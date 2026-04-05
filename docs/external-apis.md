# Parletto — External APIs

Parletto integrates with two external APIs. Both are called exclusively from the backend — the frontend never communicates with them directly.

---

## OpenWeather API

**Website:** https://openweathermap.org/api
**Plan:** Free tier (or paid for higher rate limits)
**Base URL:** `https://api.openweathermap.org/data/2.5`
**Authentication:** API key passed as `appid` query parameter

### Endpoints Used

#### Current Weather

```
GET https://api.openweathermap.org/data/2.5/weather
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| `q` | City name (e.g., `Austin`) | Used for text-based searches |
| `lat` | Latitude | Used for coordinate-based searches |
| `lon` | Longitude | Used with `lat` for coordinate-based searches |
| `units` | `imperial` or `metric` | Determines temperature and wind units |
| `appid` | API key | Required for authentication |

**When called:** Every request to Parletto's `GET /api/weather` triggers this call (unless cached).

**Response transformation:** The `WeatherMapper.toWeatherDto()` method extracts and flattens the nested OpenWeather response into a flat `WeatherDto`. Key transformations:
- `main.temp` → `temperature`
- `main.feels_like` → `feelsLike`
- `weather[0].main` → `condition`
- `sys.sunrise` / `sys.sunset` (unix timestamps) → ISO 8601 strings
- `rain?.['1h']` → `precipitation` (defaults to 0)
- `wind.gust` → `windGust` (defaults to 0)

#### 5-Day / 3-Hour Forecast

```
GET https://api.openweathermap.org/data/2.5/forecast
```

Same query parameters as Current Weather.

**When called:** Every request to Parletto's `GET /api/forecast` or `GET /api/forecast/hourly` triggers this call (unless cached).

**Response transformation:**

For daily forecast (`/api/forecast`):
- `WeatherMapper.toForecastDtos()` groups the 40 three-hour slots by date
- Calculates `tempHigh` (max of slot temps) and `tempLow` (min of slot temps) per day
- Determines dominant condition using mode (most frequent condition across slots)
- Returns 5 `ForecastDto` objects

For hourly forecast (`/api/forecast/hourly`):
- `WeatherMapper.toHourlyDtos()` maps each slot directly to an `HourlyDto`
- Returns all 40 slots (frontend displays only the first 8)

### Caching Strategy

| Data Type | Cache Key Format | TTL |
|-----------|-----------------|-----|
| Current weather | `weather:{location}:{units}` | 10 minutes (600s) |
| Forecast (daily + hourly share same source) | `forecast:{location}:{units}` / `hourly:{location}:{units}` | 30 minutes (1800s) |

Cache is in-memory using NestJS `cache-manager`. TTL values are configurable via environment variables (`WEATHER_CACHE_TTL_SECONDS`, `FORECAST_CACHE_TTL_SECONDS`).

### Known Limitations

- **City + state format:** OpenWeather does not reliably accept US-style queries like `Austin, TX`. Use plain city names (`Austin`) or coordinates (`30.27,-97.74`).
- **Free tier rate limit:** 60 requests per minute, 1,000,000 requests per month. Parletto's caching reduces actual API calls significantly.
- **UV Index:** May return 0 for some locations depending on OpenWeather's data availability.
- **Precipitation:** Only reports rain volume for the last 1 hour. Snow is not currently extracted.

### Icon URLs

Weather condition icons can be rendered using:

```
https://openweathermap.org/img/wn/{icon}@2x.png
```

Where `{icon}` is the icon code from the response (e.g., `03d`, `10n`). The frontend `CurrentWeather` and `ForecastDay` components use this pattern.

---

## GeoApify API

**Website:** https://www.geoapify.com
**Plan:** Free tier — chosen for its generous free tier with autocomplete support
**Base URL:** `https://api.geoapify.com/v1/geocode/autocomplete`
**Authentication:** API key passed as `apiKey` query parameter

### Endpoint Used

#### Geocode Autocomplete

```
GET https://api.geoapify.com/v1/geocode/autocomplete
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| `text` | Search query (e.g., `Aus`) | The partial text to autocomplete |
| `limit` | `5` | Maximum number of suggestions |
| `apiKey` | API key | Required for authentication |

**When called:** Every request to Parletto's `GET /api/geocode` triggers this call.

**Response transformation:** The `GeocodeService` maps GeoApify's GeoJSON feature collection to an array of `GeocodeSuggestionDto`:

```
GeoApify Feature                 →  GeocodeSuggestionDto
─────────────────────────────────────────────────────────
properties.place_id              →  placeId
properties.formatted             →  label
properties.lat                   →  lat
properties.lon                   →  lon
```

### How the Frontend Uses It

1. User types in the search input
2. After 3+ characters and a 300ms debounce, the frontend calls `GET /api/geocode?q={text}`
3. Suggestions appear in a dropdown (`role="listbox"`)
4. User selects a suggestion (click or Enter on highlighted item)
5. The selection's `lat,lon` coordinates are sent as the `location` parameter to weather endpoints
6. The selection's `label` is displayed in the recent searches sidebar

This coordinate-based flow avoids the OpenWeather city name parsing issues (e.g., `Austin, TX` returning 404).

### Caching Strategy

No backend caching is applied to geocode requests. Autocomplete queries are highly variable and short-lived, so caching provides minimal benefit.

### Error Handling

If GeoApify is unavailable or returns an error, the backend returns an empty array (`[]`) instead of propagating the error. This allows the user to still manually type a city name and press Enter.

### Free Tier Limits

- 3,000 requests per day
- Autocomplete endpoint included in free tier
- No credit card required

---

## API Key Management

Both API keys are stored as environment variables on the backend only:

| Variable | API | Where Used |
|----------|-----|------------|
| `OPENWEATHER_API_KEY` | OpenWeather | `WeatherService` — passed as `appid` query parameter |
| `GEOAPIFY_API_KEY` | GeoApify | `GeocodeService` — passed as `apiKey` query parameter |

Keys are accessed through `AppConfigService` (typed wrapper around `@nestjs/config`). No API key ever reaches the frontend.

### Obtaining API Keys

1. **OpenWeather:** Sign up at https://openweathermap.org/api → "Current Weather Data" → Get API Key
2. **GeoApify:** Sign up at https://www.geoapify.com → Dashboard → Create a new project → Copy the API key
