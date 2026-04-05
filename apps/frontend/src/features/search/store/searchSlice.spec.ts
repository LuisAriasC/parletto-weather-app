import { describe, it, expect } from 'vitest';
import searchReducer, { addSearch, clearSearch } from './searchSlice';

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
});
