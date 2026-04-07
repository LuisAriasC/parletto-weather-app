# Palmetto — Environment Variables

## Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENWEATHER_API_KEY` | Yes | — | API key for OpenWeather (current weather + forecast) |
| `GEOAPIFY_API_KEY` | Yes | — | API key for GeoApify (geocode autocomplete) |
| `WEATHER_CACHE_TTL_SECONDS` | No | `600` | Cache TTL for current weather data (10 min) |
| `FORECAST_CACHE_TTL_SECONDS` | No | `1800` | Cache TTL for forecast data (30 min) |
| `PORT` | No | `3000` | Port the NestJS server listens on |
| `VITE_API_BASE_URL` | No | `/api` | Frontend API base URL (build-time variable) |

---

## Configuration by Stage

### Development

Local development using Vite dev server (port 4200) and NestJS (port 3000). Vite proxies `/api/*` to the backend.

```env
# .env (project root)
OPENWEATHER_API_KEY=your_openweather_api_key_here
GEOAPIFY_API_KEY=your_geoapify_api_key_here

# Optional overrides
WEATHER_CACHE_TTL_SECONDS=600
FORECAST_CACHE_TTL_SECONDS=1800
PORT=3000
```

**Frontend:** `VITE_API_BASE_URL` is not needed — the Vite proxy handles routing.

**How to run:**
```bash
cp .env.example .env
# Fill in your API keys
npm run start:backend   # port 3000
npm run start:frontend  # port 4200, proxies /api → :3000
```

### Staging

Staging mirrors the production Docker setup but may use separate API keys with lower rate limits and shorter cache TTLs for faster iteration.

```env
# .env (project root — used by docker compose)
OPENWEATHER_API_KEY=your_staging_openweather_key
GEOAPIFY_API_KEY=your_staging_geoapify_key

# Shorter cache for faster testing
WEATHER_CACHE_TTL_SECONDS=120
FORECAST_CACHE_TTL_SECONDS=300
PORT=3000
```

**How to run:**
```bash
docker compose up --build
# Frontend: http://localhost (port 80)
# Backend: internal only (port 3000, not exposed to host)
```

**Notes:**
- Use separate API keys from production to isolate rate limit usage
- Shorter cache TTLs allow faster verification of data changes
- Consider adding a `NODE_ENV=staging` variable if you need stage-specific backend behavior

### Production

Production runs the same Docker Compose stack. The frontend container (nginx) is the only entry point — the backend is not exposed externally.

```env
# .env (project root — used by docker compose)
OPENWEATHER_API_KEY=your_production_openweather_key
GEOAPIFY_API_KEY=your_production_geoapify_key

# Production cache TTLs (defaults are fine)
WEATHER_CACHE_TTL_SECONDS=600
FORECAST_CACHE_TTL_SECONDS=1800
PORT=3000
```

**How to run:**
```bash
docker compose up --build -d
# Frontend: http://localhost (port 80)
```

**Notes:**
- Never commit the `.env` file to version control
- In a cloud deployment, inject environment variables via the platform's secrets management (e.g., AWS Secrets Manager, GCP Secret Manager, Docker Swarm secrets)
- The `PORT` variable is only relevant inside the Docker container — nginx proxies to `http://backend:3000` regardless

---

## Setup Instructions

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Obtain API keys:
   - **OpenWeather:** https://openweathermap.org/api → Sign up → Get API Key
   - **GeoApify:** https://www.geoapify.com → Sign up → Dashboard → Create project → Copy key

3. Fill in the required values in `.env`

4. Verify the backend can reach the APIs:
   ```bash
   npm run start:backend
   curl http://localhost:3000/api/health
   ```
   Check that `apiKeyConfigured` is `true` in the response.

---

## Security Notes

- **API keys are backend-only.** They are never sent to the frontend or exposed in any client-side bundle.
- **`.env` is in `.gitignore`.** Never commit it. Use `.env.example` as the template.
- **`VITE_API_BASE_URL`** is the only variable that reaches the frontend, and it contains no secrets (just the API path prefix).
- In production, prefer injecting environment variables through your deployment platform rather than file-based `.env`.
