import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RecentSearch {
  label: string;
  query: string;
  icon?: string;
}

interface SearchState {
  recents: RecentSearch[];
}

const saved = typeof window !== 'undefined'
  ? (JSON.parse(localStorage.getItem('recents') ?? '[]') as RecentSearch[])
  : [];

const searchSlice = createSlice({
  name: 'search',
  initialState: { recents: saved } as SearchState,
  reducers: {
    addSearch: (state, action: PayloadAction<RecentSearch>) => {
      const filtered = state.recents.filter((r) => r.query !== action.payload.query);
      state.recents = [action.payload, ...filtered].slice(0, 5);
    },
    removeSearch: (state, action: PayloadAction<string>) => {
      state.recents = state.recents.filter((r) => r.query !== action.payload);
    },
    clearSearch: (state) => {
      state.recents = [];
    },
    updateSearchIcon: (state, action: PayloadAction<{ query: string; icon: string }>) => {
      const item = state.recents.find((r) => r.query === action.payload.query);
      if (item) item.icon = action.payload.icon;
    },
  },
});

export const { addSearch, removeSearch, clearSearch, updateSearchIcon } = searchSlice.actions;
export default searchSlice.reducer;
