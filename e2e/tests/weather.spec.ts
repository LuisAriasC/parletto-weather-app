import { test, expect } from '@playwright/test';

test.describe('Weather App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('search valid city shows weather card', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText('Austin, US')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Toggle temperature units' })).toBeVisible();
  });

  test('search invalid city shows error message', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'xyznotacity12345');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(
      page.getByRole('alert'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('empty search shows validation message', async ({ page }) => {
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/please enter a city/i)).toBeVisible();
  });

  test('toggle units switches between °F and °C', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin, TX');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/°F/)).toBeVisible({ timeout: 10_000 });
    await page.click('button[aria-label*="Toggle temperature"]');
    await expect(page.getByText(/°C/)).toBeVisible();
  });

  test('toggle dark mode applies dark class to html', async ({ page }) => {
    await page.click('button[aria-label*="dark mode"]');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('extended weather data tiles are visible after search', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');

    // Wait for weather card to load (Feels like only appears in the weather card)
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });

    // Assert extended stat tile labels are present
    await expect(page.getByText('Visibility', { exact: true })).toBeVisible();
    await expect(page.getByText('Pressure', { exact: true })).toBeVisible();
    await expect(page.getByText('Clouds', { exact: true })).toBeVisible();
    await expect(page.getByText('Sunrise', { exact: true })).toBeVisible();
    await expect(page.getByText('Sunset', { exact: true })).toBeVisible();
  });

  test('recent search appears in sidebar after search', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText('Austin, US')).toBeVisible({ timeout: 10_000 });
    const recentButtons = page.getByRole('button', { name: 'Austin' });
    await expect(recentButtons.first()).toBeVisible();
  });

  test('Next 24h and 5-Day tab buttons are visible after search', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('tab', { name: 'Next 24h' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '5-Day' })).toBeVisible();
  });

  test('Next 24h tab is active by default after search', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });
    const threeHourBtn = page.getByRole('tab', { name: 'Next 24h' });
    await expect(threeHourBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking 5-Day tab switches to daily forecast view', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('tab', { name: '5-Day' }).click();
    await expect(page.getByText('5-Day Forecast')).toBeVisible({ timeout: 5_000 });
  });

  test('clicking back to Next 24h tab switches view', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('tab', { name: '5-Day' }).click();
    await expect(page.getByText('5-Day Forecast')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('tab', { name: 'Next 24h' }).click();
    const threeHourBtn = page.getByRole('tab', { name: 'Next 24h' });
    await expect(threeHourBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('typing 3 characters shows autocomplete dropdown', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Aus');
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 });
  });

  test('selecting autocomplete suggestion loads weather card', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Aus');
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('option').first().click();
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });
  });

  test('selected autocomplete location appears in recents with human-readable label', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 });
    const firstOption = page.getByRole('option').first();
    const labelText = await firstOption.textContent();
    await firstOption.click();
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: labelText!, exact: true })).toBeVisible();
    expect(labelText).not.toMatch(/^-?\d+\.?\d*,-?\d+\.?\d*$/);
  });

  test('pressing Escape closes dropdown without triggering a search', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Aus');
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 });
    await page.press('input[placeholder*="Search"]', 'Escape');
    await expect(page.getByRole('listbox')).not.toBeVisible();
    await expect(page.getByText(/Search for a city to get started/i)).toBeVisible();
  });

  test('ArrowDown highlights first autocomplete option', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Aus');
    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5_000 });
    await page.press('input[placeholder*="Search"]', 'ArrowDown');
    await expect(page.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
  });

  test('ArrowDown then Enter loads weather for highlighted option', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Aus');
    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5_000 });
    await page.press('input[placeholder*="Search"]', 'ArrowDown');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });
  });

  test('autocomplete shows no results found for unmatched query', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'zzxqqyzabc123');
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('No results found')).toBeVisible({ timeout: 5_000 });
  });

  test('invalid city is not added to recent searches', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'xyznotacity12345');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'xyznotacity12345', exact: true })).not.toBeVisible();
  });

  test('remove individual recent search', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByRole('button', { name: 'Austin', exact: true })).toBeVisible({ timeout: 10_000 });
    await page.click('button[aria-label="Remove Austin from recent searches"]');
    await expect(page.getByRole('button', { name: 'Austin', exact: true })).not.toBeVisible();
  });

  test('clear all recent searches', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByRole('button', { name: 'Austin', exact: true })).toBeVisible({ timeout: 10_000 });
    await page.click('button[aria-label="Clear search history"]');
    await expect(page.getByRole('button', { name: 'Austin', exact: true })).not.toBeVisible();
  });

  test('clicking a recent search loads weather for that location', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });

    await page.fill('input[placeholder*="Search"]', 'Chicago');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Austin', exact: true }).click();
    await expect(page.getByText('Austin, US')).toBeVisible({ timeout: 10_000 });
  });

  test('recent searches persist after page reload', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByRole('button', { name: 'Austin', exact: true })).toBeVisible({ timeout: 10_000 });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Austin', exact: true })).toBeVisible({ timeout: 5_000 });
  });

  test('unit preference persists after page reload', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin, TX');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/°F/)).toBeVisible({ timeout: 10_000 });
    await page.click('button[aria-label*="Toggle temperature"]');
    await expect(page.getByText(/°C/)).toBeVisible();
    await page.reload();
    await page.fill('input[placeholder*="Search"]', 'Austin, TX');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/°C/)).toBeVisible({ timeout: 10_000 });
  });

  test('dark mode persists after page reload', async ({ page }) => {
    await page.click('button[aria-label*="dark mode"]');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('hourly forecast strip shows time column header after search', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('columnheader', { name: 'Time' })).toBeVisible();
  });

  test('5-Day forecast cards show temperature values', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('tab', { name: '5-Day' }).click();
    await expect(page.getByText('5-Day Forecast')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/\d+°[FC]/).first()).toBeVisible();
  });

  test('last searched location is restored automatically after page reload', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });
    await page.reload();
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Search for a city to get started/i)).not.toBeVisible();
  });

  test('ArrowRight keyboard navigation switches from Next 24h to 5-Day tab', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.getByText(/Feels like/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('tab', { name: 'Next 24h' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: '5-Day' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('clear button appears in search input after typing', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Aus');
    await expect(page.getByRole('button', { name: 'Clear search input' })).toBeVisible();
  });

  test('clear button removes text from search input', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.getByRole('button', { name: 'Clear search input' }).click();
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Clear search input' })).not.toBeVisible();
  });

  test('search input clears after selecting an autocomplete suggestion', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Aus');
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('option').first().click();
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('');
  });

  test('search input clears after pressing Enter to search', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Austin');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('');
  });
});
