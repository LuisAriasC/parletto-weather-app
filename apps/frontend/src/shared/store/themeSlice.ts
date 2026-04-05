import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark';

const savedTheme = (typeof window !== 'undefined' ? localStorage.getItem('theme') : null) as Theme | null;

const themeSlice = createSlice({
  name: 'theme',
  initialState: (savedTheme ?? 'light') as Theme,
  reducers: {
    toggleTheme: (state) => (state === 'light' ? 'dark' : 'light'),
    setTheme: (_state, action: PayloadAction<Theme>) => action.payload,
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
