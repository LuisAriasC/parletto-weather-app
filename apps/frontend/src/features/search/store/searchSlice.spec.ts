import { describe, it, expect } from 'vitest';
import searchReducer, { addSearch, clearSearch, removeSearch, updateSearchIcon } from './searchSlice';

describe('searchSlice', () => {
  it('has empty array as initial state', () => {
    expect(searchReducer(undefined, { type: '@@INIT' })).toEqual({ recents: [] });
  });

  it('adds a new { label, query } search to the front', () => {
    const state = searchReducer(
      { recents: [] },
      addSearch({ label: 'Austin, Texas, United States', query: '30.2672,-97.7431' }),
    );
    expect(state.recents[0]).toEqual({ label: 'Austin, Texas, United States', query: '30.2672,-97.7431' });
  });

  it('deduplicates by query — moves existing entry to front', () => {
    const initial = {
      recents: [
        { label: 'Austin, Texas, United States', query: '30.2672,-97.7431' },
        { label: 'New York City, New York, United States', query: '40.7128,-74.0060' },
      ],
    };
    const state = searchReducer(
      initial,
      addSearch({ label: 'New York City, New York, United States', query: '40.7128,-74.0060' }),
    );
    expect(state.recents).toEqual([
      { label: 'New York City, New York, United States', query: '40.7128,-74.0060' },
      { label: 'Austin, Texas, United States', query: '30.2672,-97.7431' },
    ]);
  });

  it('caps history at 5 entries', () => {
    const initial = {
      recents: [
        { label: 'a', query: 'qa' },
        { label: 'b', query: 'qb' },
        { label: 'c', query: 'qc' },
        { label: 'd', query: 'qd' },
        { label: 'e', query: 'qe' },
      ],
    };
    const state = searchReducer(initial, addSearch({ label: 'f', query: 'qf' }));
    expect(state.recents).toHaveLength(5);
    expect(state.recents[0]).toEqual({ label: 'f', query: 'qf' });
  });

  it('clears all recents', () => {
    const state = searchReducer(
      { recents: [{ label: 'Austin', query: '30.2672,-97.7431' }] },
      clearSearch(),
    );
    expect(state.recents).toEqual([]);
  });

  describe('removeSearch', () => {
    it('removes the entry with the matching query', () => {
      const initial = {
        recents: [
          { label: 'Austin, Texas, United States', query: '30.2672,-97.7431' },
          { label: 'New York City, New York, United States', query: '40.7128,-74.0060' },
        ],
      };
      const state = searchReducer(initial, removeSearch('30.2672,-97.7431'));
      expect(state.recents).toEqual([
        { label: 'New York City, New York, United States', query: '40.7128,-74.0060' },
      ]);
    });

    it('is a no-op when query is not found', () => {
      const initial = {
        recents: [{ label: 'Austin, Texas, United States', query: '30.2672,-97.7431' }],
      };
      const state = searchReducer(initial, removeSearch('99.9999,-99.9999'));
      expect(state.recents).toHaveLength(1);
    });

    it('results in empty array when removing the only entry', () => {
      const initial = {
        recents: [{ label: 'Austin', query: '30.2672,-97.7431' }],
      };
      const state = searchReducer(initial, removeSearch('30.2672,-97.7431'));
      expect(state.recents).toEqual([]);
    });
  });

  describe('updateSearchIcon', () => {
    it('sets icon on the matching entry', () => {
      const initial = {
        recents: [{ label: 'Austin', query: '30.2672,-97.7431' }],
      };
      const state = searchReducer(
        initial,
        updateSearchIcon({ query: '30.2672,-97.7431', icon: '02d' }),
      );
      expect(state.recents[0].icon).toBe('02d');
    });

    it('updates icon if entry already has one', () => {
      const initial = {
        recents: [{ label: 'Austin', query: '30.2672,-97.7431', icon: '01d' }],
      };
      const state = searchReducer(
        initial,
        updateSearchIcon({ query: '30.2672,-97.7431', icon: '10d' }),
      );
      expect(state.recents[0].icon).toBe('10d');
    });

    it('is a no-op when query is not found', () => {
      const initial = {
        recents: [{ label: 'Austin', query: '30.2672,-97.7431' }],
      };
      const state = searchReducer(
        initial,
        updateSearchIcon({ query: 'nonexistent', icon: '02d' }),
      );
      expect(state.recents[0].icon).toBeUndefined();
    });

    it('does not mutate other entries', () => {
      const initial = {
        recents: [
          { label: 'Austin', query: '30.2672,-97.7431' },
          { label: 'New York', query: '40.7128,-74.0060' },
        ],
      };
      const state = searchReducer(
        initial,
        updateSearchIcon({ query: '30.2672,-97.7431', icon: '02d' }),
      );
      expect(state.recents[1].icon).toBeUndefined();
    });
  });
});
