import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToastMessage {
  id: string;
  text: string;
}

interface ToastState {
  messages: ToastMessage[];
}

const toastSlice = createSlice({
  name: 'toast',
  initialState: { messages: [] } as ToastState,
  reducers: {
    addToast: (state, action: PayloadAction<string>) => {
      state.messages.push({ id: Date.now().toString(), text: action.payload });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter((m) => m.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;
