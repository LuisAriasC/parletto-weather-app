# Forecast Requirements

## Functional Requirements

### Tab Navigation
- [x] Two tabs are visible after a search: "Next 24h" and "5-Day"
- [x] "Next 24h" tab is active by default
- [x] Clicking a tab switches the forecast view
- [x] Active tab has `aria-pressed="true"` for accessibility

### Hourly Forecast (Next 24h)
- [x] Display the next 8 three-hour forecast slots
- [x] Each slot shows time, temperature, rain probability (%), and wind speed
- [x] Data comes from the first 8 entries of `/api/forecast/hourly`
- [x] Refreshes when location or units change

### 5-Day Daily Forecast
- [x] Display 5 forecast cards in a grid
- [x] Each card shows: day name, weather icon, high temperature, low temperature
- [x] "5-Day Forecast" heading is visible when this tab is active
- [x] Data comes from `/api/forecast` (backend aggregates 3-hour slots into daily summaries)
- [x] Refreshes when location or units change

### Future Enhancements
- [ ] Show precipitation chart or graph for the next 24 hours
- [ ] Expand hourly view to show all 40 slots (full 5-day hourly) with scrolling
- [ ] Add a "feels like" column to the hourly forecast table
- [ ] Show wind direction arrows in hourly and daily forecasts
