import { describe, it, expect, vi } from 'vitest';
import toastReducer, { addToast, removeToast } from './toastSlice';

describe('toastSlice', () => {
  it('has empty messages as initial state', () => {
    expect(toastReducer(undefined, { type: '@@INIT' })).toEqual({ messages: [] });
  });

  describe('addToast', () => {
    it('adds a message with the provided text', () => {
      const state = toastReducer({ messages: [] }, addToast('Something went wrong'));
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].text).toBe('Something went wrong');
    });

    it('assigns a non-empty string id to each message', () => {
      const state = toastReducer({ messages: [] }, addToast('Error'));
      expect(typeof state.messages[0].id).toBe('string');
      expect(state.messages[0].id.length).toBeGreaterThan(0);
    });

    it('assigns unique ids when Date.now() returns different values', () => {
      let time = 1_000_000;
      vi.spyOn(Date, 'now').mockImplementation(() => time++);

      let state = toastReducer({ messages: [] }, addToast('First'));
      state = toastReducer(state, addToast('Second'));

      expect(state.messages[0].id).not.toBe(state.messages[1].id);
      vi.restoreAllMocks();
    });

    it('accumulates multiple messages', () => {
      let state = toastReducer({ messages: [] }, addToast('First error'));
      state = toastReducer(state, addToast('Second error'));
      expect(state.messages).toHaveLength(2);
      expect(state.messages.map((m) => m.text)).toEqual(['First error', 'Second error']);
    });
  });

  describe('removeToast', () => {
    it('removes the message with the matching id', () => {
      const initial = { messages: [{ id: 'abc', text: 'Error' }] };
      const state = toastReducer(initial, removeToast('abc'));
      expect(state.messages).toHaveLength(0);
    });

    it('leaves other messages untouched', () => {
      const initial = {
        messages: [
          { id: '1', text: 'First' },
          { id: '2', text: 'Second' },
        ],
      };
      const state = toastReducer(initial, removeToast('1'));
      expect(state.messages).toEqual([{ id: '2', text: 'Second' }]);
    });

    it('is a no-op when id does not exist', () => {
      const initial = { messages: [{ id: 'abc', text: 'Error' }] };
      const state = toastReducer(initial, removeToast('nonexistent'));
      expect(state.messages).toHaveLength(1);
    });
  });
});
