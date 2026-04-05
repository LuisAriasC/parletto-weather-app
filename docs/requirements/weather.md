# Weather Display Requirements

## Functional Requirements

### Current Weather Card
- [x] Display city name and country code
- [x] Display current temperature with unit symbol (°F or °C)
- [x] Display "feels like" temperature
- [x] Display weather condition with icon (from OpenWeather icon set)
- [x] Display weather condition description (e.g., "scattered clouds")

### Stat Tiles
- [x] Display humidity percentage
- [x] Display wind speed with compass direction (16-point: N, NNE, NE, etc.)
- [x] Display wind gust speed
- [x] Display UV Index
- [x] Display daily high/low temperatures
- [x] Display visibility (miles for imperial, km for metric)
- [x] Display atmospheric pressure (inHg for imperial, hPa for metric)
- [x] Display cloud coverage percentage
- [x] Display precipitation volume
- [x] Display sunrise time
- [x] Display sunset time

### Unit Toggle
- [x] Toggle button in header switches between Imperial (°F) and Metric (°C)
- [x] Unit preference persists across page reloads (localStorage)
- [x] Changing units re-fetches weather data with the new unit system
- [x] All stat tiles update their display format when units change (visibility, pressure, precipitation)

### Placeholder State
- [x] Before any search, show a "Search for a city to get started" message
- [x] Loading spinner displays while weather data is being fetched
- [x] Error message displays when the API returns an error

### Future Enhancements
- [ ] Display a weather-themed background or gradient based on current conditions
- [ ] Show a mini map with the searched location pinned
- [ ] Display air quality index (AQI) data
- [ ] Show weather alerts/warnings when available
