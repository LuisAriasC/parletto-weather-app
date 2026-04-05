import { describe, it, expect } from 'vitest';
import settingsReducer, { setUnits, toggleUnits } from './settingsSlice';

describe('settingsSlice', () => {
  it('has imperial as initial state', () => {
    expect(settingsReducer(undefined, { type: '@@INIT' })).toEqual({ units: 'imperial' });
  });

  it('toggles units from imperial to metric', () => {
    expect(settingsReducer({ units: 'imperial' }, toggleUnits())).toEqual({ units: 'metric' });
  });

  it('toggles units from metric to imperial', () => {
    expect(settingsReducer({ units: 'metric' }, toggleUnits())).toEqual({ units: 'imperial' });
  });

  it('sets units explicitly', () => {
    expect(settingsReducer({ units: 'imperial' }, setUnits('metric'))).toEqual({ units: 'metric' });
  });
});
