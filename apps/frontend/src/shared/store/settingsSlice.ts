import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Units } from '@palmetto/shared';

interface SettingsState {
  units: Units;
}

const saved = (typeof window !== 'undefined' ? localStorage.getItem('units') : null) as Units | null;

const settingsSlice = createSlice({
  name: 'settings',
  initialState: { units: (saved ?? 'imperial') as Units } as SettingsState,
  reducers: {
    toggleUnits: (state) => {
      state.units = state.units === 'imperial' ? 'metric' : 'imperial';
    },
    setUnits: (state, action: PayloadAction<Units>) => {
      state.units = action.payload;
    },
  },
});

export const { toggleUnits, setUnits } = settingsSlice.actions;
export default settingsSlice.reducer;
