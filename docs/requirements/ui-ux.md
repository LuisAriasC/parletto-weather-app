# UI & UX Requirements

## Functional Requirements

### Dark Mode
- [x] Toggle button in header switches between light and dark themes
- [x] Dark mode adds `dark` class to `<html>` element
- [x] Tailwind `dark:` variant applies dark-specific styles throughout the app
- [x] Theme preference persists across page reloads (localStorage)
- [x] Toggle button shows a sun/moon icon to indicate current state

### Layout
- [x] Three-panel layout: Header (top), Sidebar (left), Main Panel (center)
- [x] Sidebar is 224px wide (`w-56`) with a border separator
- [x] Header spans the full width with the app title and toggle controls
- [x] Main panel fills remaining space and scrolls independently
- [x] Sidebar collapses on mobile/small screens (responsive breakpoint)
- [x] Add a hamburger menu to toggle sidebar visibility on mobile

### Error Display
- [x] API errors render with a styled alert component (`role="alert"`)
- [x] Error messages are user-friendly — status codes are mapped to readable messages
- [x] `ErrorBoundary` wraps the app and shows a fallback UI for uncaught errors
- [x] Add a "Retry" button on error states to re-fetch weather data
- [x] Show a toast notification for transient errors instead of replacing the whole view

### Loading States
- [x] Loading spinner shown while weather data is being fetched
- [x] Skeleton loading placeholders for weather card and forecast sections
- [x] Show progress indicator on autocomplete while fetching suggestions

### Accessibility
- [x] Autocomplete dropdown uses `role="listbox"` with `role="option"` items
- [x] Active forecast tab uses `aria-pressed="true"`
- [x] Clear button has `aria-label="Clear search history"`
- [x] Temperature toggle has `aria-label` containing "Toggle temperature"
- [x] Dark mode toggle has `aria-label` containing "dark mode"
- [x] Add keyboard navigation for forecast tabs
- [x] Ensure all interactive elements have visible focus indicators
- [x] Add `aria-live` region for weather card updates (screen reader announcements)
- [x] Run a full WCAG 2.1 AA audit

### Future Enhancements
- [ ] Add animations/transitions for weather card loading and tab switching
- [ ] Add a "favorites" feature to pin frequently checked locations
- [ ] Add geolocation API support to auto-detect user's current location
- [ ] Support multiple language/locale options
