# Palmetto — API Reference

All endpoints are prefixed with `/api`. In development, the Vite dev server proxies requests from `localhost:4200/api/*` to `localhost:3000/api/*`. In production, nginx proxies `/api/*` to the backend container.

**Global rate limit:** 30 requests per 60 seconds per IP (configurable via `ThrottlerModule`).

---

## Current Weather

Retrieve current weather conditions for a location.

```
GET /api/weather
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `location` | string | Yes | — | City name (e.g., `Austin`) or coordinates (e.g., `30.27,-97.74`) |
| `units` | string | No | `imperial` | `imperial` (°F, mph) or `metric` (°C, m/s) |

### Rate Limit

20 requests per 60 seconds.

### Success Response

**Status:** `200 OK`

```json
{
  "city": "Austin",
  "country": "US",
  "temperature": 85,
  "feelsLike": 88,
  "tempMin": 80,
  "tempMax": 90,
  "humidity": 55,
  "pressure": 1015,
  "windSpeed": 12,
  "windDeg": 180,
  "windGust": 18,
  "clouds": 25,
  "visibility": 10000,
  "uvIndex": 7,
  "precipitation": 0,
  "condition": "Clouds",
  "conditionDescription": "scattered clouds",
  "icon": "03d",
  "sunrise": "2026-04-04T06:45:00.000Z",
  "sunset": "2026-04-04T19:30:00.000Z",
  "dt": "2026-04-04T14:00:00.000Z",
  "timezone": -18000,
  "lat": 30.2672,
  "lon": -97.7431
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `city` | string | City name |
| `country` | string | ISO 3166 country code |
| `temperature` | number | Current temperature |
| `feelsLike` | number | Perceived temperature |
| `tempMin` | number | Minimum temperature (current observation) |
| `tempMax` | number | Maximum temperature (current observation) |
| `humidity` | number | Humidity percentage (0–100) |
| `pressure` | number | Atmospheric pressure in hPa |
| `windSpeed` | number | Wind speed (mph or m/s depending on units) |
| `windDeg` | number | Wind direction in degrees (0–360) |
| `windGust` | number | Wind gust speed (may be 0 if unavailable) |
| `clouds` | number | Cloud coverage percentage (0–100) |
| `visibility` | number | Visibility in meters |
| `uvIndex` | number | UV index (0–11+) |
| `precipitation` | number | Precipitation volume in mm (last 1h, 0 if none) |
| `condition` | string | Weather condition group (e.g., `Clear`, `Clouds`, `Rain`) |
| `conditionDescription` | string | Human-readable description (e.g., `scattered clouds`) |
| `icon` | string | OpenWeather icon code (e.g., `03d`) — use `https://openweathermap.org/img/wn/{icon}@2x.png` |
| `sunrise` | string | ISO 8601 sunrise time |
| `sunset` | string | ISO 8601 sunset time |
| `dt` | string | ISO 8601 observation time |
| `timezone` | number | UTC offset in seconds |
| `lat` | number | Latitude |
| `lon` | number | Longitude |

### Error Responses

| Status | Body | Cause |
|--------|------|-------|
| `400` | `{ "statusCode": 400, "message": "Location is required", "error": "Bad Request" }` | Missing `location` parameter |
| `404` | `{ "statusCode": 404, "message": "Location not found", "error": "Not Found" }` | OpenWeather returned 404 for the query |
| `502` | `{ "statusCode": 502, "message": "Weather service unavailable", "error": "Bad Gateway" }` | OpenWeather API is down or unreachable |

---

## 5-Day Daily Forecast

Retrieve a 5-day daily forecast aggregated from 3-hour intervals.

```
GET /api/forecast
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `location` | string | Yes | — | City name or coordinates |
| `units` | string | No | `imperial` | `imperial` or `metric` |

### Rate Limit

20 requests per 60 seconds.

### Success Response

**Status:** `200 OK`

```json
[
  {
    "date": "2026-04-04",
    "tempHigh": 90,
    "tempLow": 72,
    "condition": "Clouds",
    "conditionDescription": "broken clouds",
    "icon": "04d"
  },
  {
    "date": "2026-04-05",
    "tempHigh": 88,
    "tempLow": 70,
    "condition": "Clear",
    "conditionDescription": "clear sky",
    "icon": "01d"
  }
]
```

### Response Fields (per item)

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Date in `YYYY-MM-DD` format |
| `tempHigh` | number | Highest temperature for the day |
| `tempLow` | number | Lowest temperature for the day |
| `condition` | string | Dominant weather condition for the day |
| `conditionDescription` | string | Description of dominant condition |
| `icon` | string | OpenWeather icon code for dominant condition |

### Notes

The backend fetches 40 three-hour slots from OpenWeather's `/forecast` endpoint and groups them by date. For each day, it calculates the high/low temperatures and determines the dominant condition by frequency (mode).

### Error Responses

Same as [Current Weather](#error-responses).

---

## Hourly Forecast (3-Hour Intervals)

Retrieve up to 40 three-hour forecast slots (approximately 5 days).

```
GET /api/forecast/hourly
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `location` | string | Yes | — | City name or coordinates |
| `units` | string | No | `imperial` | `imperial` or `metric` |

### Rate Limit

20 requests per 60 seconds.

### Success Response

**Status:** `200 OK`

```json
[
  {
    "dt": "2026-04-04T15:00:00.000Z",
    "temperature": 85,
    "feelsLike": 88,
    "condition": "Clouds",
    "conditionDescription": "scattered clouds",
    "icon": "03d",
    "pop": 0.1,
    "windSpeed": 12,
    "windDeg": 180,
    "humidity": 55
  }
]
```

### Response Fields (per item)

| Field | Type | Description |
|-------|------|-------------|
| `dt` | string | ISO 8601 forecast time |
| `temperature` | number | Forecasted temperature |
| `feelsLike` | number | Forecasted feels-like temperature |
| `condition` | string | Weather condition group |
| `conditionDescription` | string | Human-readable description |
| `icon` | string | OpenWeather icon code |
| `pop` | number | Probability of precipitation (0.0–1.0) |
| `windSpeed` | number | Wind speed |
| `windDeg` | number | Wind direction in degrees |
| `humidity` | number | Humidity percentage |

### Notes

The frontend displays the first 8 slots (24 hours) in the "Next 24h" tab. All 40 slots are available in the response.

### Error Responses

Same as [Current Weather](#error-responses).

---

## Geocode Autocomplete

Search for city suggestions based on a text query. Used by the frontend's autocomplete input.

```
GET /api/geocode
```

### Query Parameters

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `q` | string | Yes | 2–100 characters | Search text (e.g., `Aus`, `Austin`, `London`) |

### Rate Limit

20 requests per 60 seconds.

### Success Response

**Status:** `200 OK`

```json
[
  {
    "placeId": "51c8e09a1b2c3d4e5f...",
    "label": "Austin, Travis County, Texas, United States",
    "lat": 30.2711286,
    "lon": -97.7436995
  },
  {
    "placeId": "62d9f10b2c3d4e5f6a...",
    "label": "Austin, Mower County, Minnesota, United States",
    "lat": 43.6666296,
    "lon": -92.9746367
  }
]
```

### Response Fields (per item)

| Field | Type | Description |
|-------|------|-------------|
| `placeId` | string | Unique identifier from GeoApify |
| `label` | string | Human-readable formatted address |
| `lat` | number | Latitude |
| `lon` | number | Longitude |

### Notes

- Returns up to 5 suggestions
- On GeoApify failure, returns an empty array (does not propagate the error)
- The frontend sends the selected suggestion's `lat,lon` as the `location` parameter to weather endpoints

### Error Responses

| Status | Body | Cause |
|--------|------|-------|
| `400` | `{ "statusCode": 400, "message": "Query must be between 2 and 100 characters", "error": "Bad Request" }` | `q` parameter too short or too long |

---

## Health Check

Check backend health, API configuration status, and cache performance metrics.

```
GET /api/health
```

### Rate Limit

None (rate limiting is skipped for this endpoint).

### Success Response

**Status:** `200 OK`

```json
{
  "status": "ok",
  "apiKeyConfigured": true,
  "uptime": 3600.5,
  "timestamp": "2026-04-04T14:00:00.000Z",
  "metrics": {
    "cacheHits": 150,
    "cacheMisses": 45,
    "apiCalls": 45,
    "cacheHitRate": 76.92
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"ok"` |
| `apiKeyConfigured` | boolean | Whether `OPENWEATHER_API_KEY` is set |
| `uptime` | number | Server uptime in seconds |
| `timestamp` | string | ISO 8601 current server time |
| `metrics.cacheHits` | number | Total cache hits since startup |
| `metrics.cacheMisses` | number | Total cache misses since startup |
| `metrics.apiCalls` | number | Total external API calls since startup |
| `metrics.cacheHitRate` | number | Cache hit rate as a percentage |

---

## Location Parameter Format

All weather endpoints accept `location` in two formats:

| Format | Example | Backend Behavior |
|--------|---------|-----------------|
| City name | `Austin` | Sent as `q=Austin` to OpenWeather |
| Coordinates | `30.27,-97.74` | Sent as `lat=30.27&lon=-97.74` to OpenWeather |

The backend detects coordinates using the regex `/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/`.

**Important:** OpenWeather does not reliably support US state abbreviations (e.g., `Austin, TX` may return a 404). Use plain city names or coordinates from the geocode endpoint.

---

## Common Error Response Format

All error responses follow the `ErrorDto` shape:

```json
{
  "statusCode": 404,
  "message": "Location not found",
  "error": "Not Found"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `statusCode` | number | HTTP status code |
| `message` | string | Human-readable error message |
| `error` | string | HTTP status text |
