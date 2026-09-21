/** Stage 6 - epsilon closure and move. */

import { describe, expect, it } from 'vitest';
import { epsilonClosure, move, stateSetKey } from '../../src/compiler/epsilonClosure';
import type { NFA } from '../../src/compiler/types';

/** Builds a tiny hand-written NFA so each closure case is obvious to read. */
function nfaWith(
  states: number[],
  transitions: { from: number; to: number; symbol: string | null }[],
  alphabet: string[] = ['a', 'b']
): NFA {
  return { states, alphabet, startState: states[0], acceptStates: [], transitions };
}

describe('epsilonClosure', () => {
  it('includes the starting states themselves', () => {
    const nfa = nfaWith([0, 1], []);
    expect(epsilonClosure(nfa, [0])).toEqual([0]);
    expect(epsilonClosure(nfa, [0, 1])).toEqual([0, 1]);
  });

  it('follows a single epsilon edge', () => {
    const nfa = nfaWith([0, 1], [{ from: 0, to: 1, symbol: null }]);
    expect(epsilonClosure(nfa, [0])).toEqual([0, 1]);
  });

  it('follows a chain of epsilon edges to the end', () => {
    const nfa = nfaWith(
      [0, 1, 2, 3],
      [
        { from: 0, to: 1, symbol: null },
        { from: 1, to: 2, symbol: null },
        { from: 2, to: 3, symbol: null },
      ]
    );
    expect(epsilonClosure(nfa, [0])).toEqual([0, 1, 2, 3]);
    expect(epsilonClosure(nfa, [2])).toEqual([2, 3]);
  });

  it('follows branching epsilon edges', () => {
    const nfa = nfaWith(
      [0, 1, 2, 3],
      [
        { from: 0, to: 1, symbol: null },
        { from: 0, to: 2, symbol: null },
        { from: 2, to: 3, symbol: null },
      ]
    );
    expect(epsilonClosure(nfa, [0])).toEqual([0, 1, 2, 3]);
  });

  it('terminates on a two-state epsilon cycle', () => {
    const nfa = nfaWith(
      [0, 1],
      [
        { from: 0, to: 1, symbol: null },
        { from: 1, to: 0, symbol: null },
      ]
    );
    expect(epsilonClosure(nfa, [0])).toEqual([0, 1]);
    expect(epsilonClosure(nfa, [1])).toEqual([0, 1]);
  });

  it('terminates on a longer epsilon cycle', () => {
    const nfa = nfaWith(
      [0, 1, 2],
      [
        { from: 0, to: 1, symbol: null },
        { from: 1, to: 2, symbol: null },
        { from: 2, to: 0, symbol: null },
      ]
    );
    expect(epsilonClosure(nfa, [1])).toEqual([0, 1, 2]);
  });

  it('terminates on a self-loop', () => {
    const nfa = nfaWith([0], [{ from: 0, to: 0, symbol: null }]);
    expect(epsilonClosure(nfa, [0])).toEqual([0]);
  });

  it('does not follow symbol transitions', () => {
    const nfa = nfaWith(
      [0, 1, 2],
      [
        { from: 0, to: 1, symbol: 'a' },
        { from: 1, to: 2, symbol: null },
      ]
    );
    expect(epsilonClosure(nfa, [0])).toEqual([0]);
  });

  it('is idempotent - closing an already-closed set changes nothing', () => {
    const nfa = nfaWith(
      [0, 1, 2],
      [
        { from: 0, to: 1, symbol: null },
        { from: 1, to: 2, symbol: null },
      ]
    );
    const once = epsilonClosure(nfa, [0]);
    expect(epsilonClosure(nfa, once)).toEqual(once);
  });

  it('returns a sorted, duplicate-free array', () => {
    const nfa = nfaWith(
      [0, 1, 2, 3],
      [
        { from: 3, to: 0, symbol: null },
        { from: 3, to: 2, symbol: null },
        { from: 2, to: 0, symbol: null },
      ]
    );
    expect(epsilonClosure(nfa, [3, 3, 2])).toEqual([0, 2, 3]);
  });

  it('handles an empty input set', () => {
    const nfa = nfaWith([0, 1], [{ from: 0, to: 1, symbol: null }]);
    expect(epsilonClosure(nfa, [])).toEqual([]);
  });
});

describe('move', () => {
  const nfa = nfaWith(
    [0, 1, 2, 3],
    [
      { from: 0, to: 1, symbol: 'a' },
      { from: 0, to: 2, symbol: 'a' },
      { from: 0, to: 3, symbol: 'b' },
      { from: 1, to: 3, symbol: null },
    ]
  );

  it('returns every state reachable on exactly one symbol', () => {
    expect(move(nfa, [0], 'a')).toEqual([1, 2]);
    expect(move(nfa, [0], 'b')).toEqual([3]);
  });

  it('does not take epsilon steps', () => {
    // 0 -a-> 1 -eps-> 3, but move stops after the single symbol step.
    expect(move(nfa, [0], 'a')).not.toContain(3);
  });

  it('returns an empty array when no transition matches', () => {
    expect(move(nfa, [0], 'c')).toEqual([]);
    expect(move(nfa, [3], 'a')).toEqual([]);
  });

  it('unions the results over the whole input set', () => {
    expect(move(nfa, [0, 1], 'a')).toEqual([1, 2]);
  });

  it('returns a sorted, duplicate-free array', () => {
    const shared = nfaWith(
      [0, 1, 2],
      [
        { from: 0, to: 2, symbol: 'a' },
        { from: 1, to: 2, symbol: 'a' },
      ]
    );
    expect(move(shared, [1, 0], 'a')).toEqual([2]);
  });

  it('handles an empty input set', () => {
    expect(move(nfa, [], 'a')).toEqual([]);
  });
});

describe('stateSetKey', () => {
  it('gives the same key regardless of order or duplicates', () => {
    expect(stateSetKey([1, 2, 3])).toBe('1,2,3');
    expect(stateSetKey([3, 1, 2])).toBe('1,2,3');
    expect(stateSetKey([2, 3, 1])).toBe('1,2,3');
    expect(stateSetKey([1, 1, 2, 3, 3])).toBe('1,2,3');
  });

  it('sorts numerically, not lexicographically', () => {
    // "10" sorts before "9" as a string, which would make two different
    // subsets collide on one key.
    expect(stateSetKey([9, 10])).toBe('9,10');
    expect(stateSetKey([10, 9])).toBe('9,10');
  });

  it('distinguishes different sets', () => {
    expect(stateSetKey([1, 2])).not.toBe(stateSetKey([1, 2, 3]));
    expect(stateSetKey([1, 2])).not.toBe(stateSetKey([1, 23]));
  });

  it('gives an empty key for the empty set', () => {
    expect(stateSetKey([])).toBe('');
  });
});
