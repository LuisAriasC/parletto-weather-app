# Palmetto — Requirements Index

This folder contains all functional and non-functional requirements for Palmetto, organized by feature area.

## How This Document Works

Each requirement uses a checkbox to track implementation status:

- `[x]` — Implemented and working
- `[ ]` — Planned / not yet implemented

## How to Grow This Document

When adding a new feature or capability:

1. **If it fits an existing file** — add requirements to the appropriate file below
2. **If it's a new feature area** — create a new file (e.g., `notifications.md`, `user-accounts.md`) and add it to the index below
3. **Keep requirements atomic** — one checkbox per discrete behavior, not per epic
4. **Mark done when shipped** — flip `[ ]` to `[x]` once the feature is implemented and tested

## Requirement Files

| File | Area | Description |
|------|------|-------------|
| [search.md](search.md) | Search & Autocomplete | City search, autocomplete, recent searches |
| [weather.md](weather.md) | Weather Display | Current weather card, stat tiles, units |
| [forecasting.md](forecasting.md) | Forecasts | Hourly and 5-day forecast views |
| [infrastructure.md](infrastructure.md) | Infrastructure | Backend, caching, rate limiting, Docker, security |
| [ui-ux.md](ui-ux.md) | UI & UX | Dark mode, responsive layout, error handling, accessibility |
