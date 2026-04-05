import { describe, it, expect } from 'vitest';
import themeReducer, { toggleTheme, setTheme } from './themeSlice';

describe('themeSlice', () => {
  it('has light as initial state', () => {
    expect(themeReducer(undefined, { type: '@@INIT' })).toBe('light');
  });

  it('toggles from light to dark', () => {
    expect(themeReducer('light', toggleTheme())).toBe('dark');
  });

  it('toggles from dark to light', () => {
    expect(themeReducer('dark', toggleTheme())).toBe('light');
  });

  it('sets theme explicitly', () => {
    expect(themeReducer('light', setTheme('dark'))).toBe('dark');
  });
});
