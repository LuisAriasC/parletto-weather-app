import { configureStore } from '@reduxjs/toolkit';
import themeReducer from '../../shared/store/themeSlice';
import settingsReducer from '../../shared/store/settingsSlice';
import { searchReducer } from '../../features/search';
import toastReducer from '../../shared/store/toastSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    settings: settingsReducer,
    search: searchReducer,
    toast: toastReducer,
  },
});

store.subscribe(() => {
  const state = store.getState();
  localStorage.setItem('theme', state.theme);
  localStorage.setItem('units', state.settings.units);
  localStorage.setItem('recents', JSON.stringify(state.search.recents));
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
