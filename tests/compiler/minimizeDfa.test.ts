/**
 * Stage 8 - DFA minimization.
 *
 * Tests equivalence classes and language preservation, not exact state ids.
 */

import { describe, expect, it } from 'vitest';
import { minimizeDfa } from '../../src/compiler/minimizeDfa';
import { subsetConstruction } from '../../src/compiler/subsetConstruction';
import { thompsonConstruction } from '../../src/compiler/thompson';
import { infixToPostfix } from '../../src/compiler/infixToPostfix';
import { insertExplicitConcatenation } from '../../src/compiler/explicitConcatenation';
import { tokenize } from '../../src/compiler/tokenizer';
import {
  allStringsUpTo,
  assertDenseIds,
  assertDfaInvariants,
  dfaAccepts,
} from './support/automata';
import type { DFA } from '../../src/compiler/types';

function buildDfa(regex: string): DFA {
  return subsetConstruction(
    thompsonConstruction(infixToPostfix(insertExplicitConcatenation(tokenize(regex))))
  );
}

const EXPRESSIONS = ['a', 'a|b', 'ab', 'a*', '(a|b)*', '(a|b)*abb', 'a(b|c)*', '(a|b)(c|d)'];

describe('structural invariants', () => {
  it.each(EXPRESSIONS)('%s produces a well-formed minimized DFA', (regex) => {
    expect(() => assertDfaInvariants(minimizeDfa(buildDfa(regex)))).not.toThrow();
  });

  it.each(EXPRESSIONS)('%s renumbers states densely from 0', (regex) => {
    expect(() => assertDenseIds(minimizeDfa(buildDfa(regex)))).not.toThrow();
  });

  it.each(EXPRESSIONS)('%s never grows the automaton', (regex) => {
    const dfa = buildDfa(regex);
    expect(minimizeDfa(dfa).states.length).toBeLessThanOrEqual(dfa.states.length);
  });

  it('does not mutate the input DFA', () => {
    const dfa = buildDfa('(a|b)*abb');
    const snapshot = JSON.parse(JSON.stringify(dfa));
    minimizeDfa(dfa);
    expect(dfa).toEqual(snapshot);
  });

  it('keeps the alphabet', () => {
    expect(minimizeDfa(buildDfa('(a|b)(c|d)')).alphabet).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('merging equivalent states', () => {
  it('merges the two equivalent accepting states of a|b', () => {
    // Subset construction gives one accepting state per branch; both accept
    // exactly the empty continuation, so they are equivalent.
    expect(buildDfa('a|b').states).toHaveLength(3);
    expect(minimizeDfa(buildDfa('a|b')).states).toHaveLength(2);
  });

  it('collapses a* to a single state', () => {
    expect(buildDfa('a*').states).toHaveLength(2);
    expect(minimizeDfa(buildDfa('a*')).states).toHaveLength(1);
  });

  it('reduces the dragon book DFA for (a|b)*abb from five states to four', () => {
    expect(buildDfa('(a|b)*abb').states).toHaveLength(5);
    expect(minimizeDfa(buildDfa('(a|b)*abb')).states).toHaveLength(4);
  });

  it('collapses (a|b)* to a single accepting state with a self-loop', () => {
    const minimized = minimizeDfa(buildDfa('(a|b)*'));
    expect(minimized.states).toHaveLength(1);
    expect(minimized.states[0].isAccepting).toBe(true);
    expect(minimized.transitions).toEqual([
      { from: 0, to: 0, symbol: 'a' },
      { from: 0, to: 0, symbol: 'b' },
    ]);
  });

  it('leaves an already-minimal DFA unchanged in size', () => {
    const minimized = minimizeDfa(buildDfa('ab'));
    expect(minimized.states).toHaveLength(3);
    expect(minimizeDfa(minimized).states).toHaveLength(3);
  });

  it('is idempotent', () => {
    for (const regex of EXPRESSIONS) {
      const once = minimizeDfa(buildDfa(regex));
      expect(minimizeDfa(once)).toEqual(once);
    }
  });
});

describe('the merged state mapping', () => {
  it('unions the NFA subsets of the states it merged', () => {
    const dfa = buildDfa('a|b');
    const minimized = minimizeDfa(dfa);
    const mergedAccepting = minimized.states.find((state) => state.isAccepting);
    const originalAccepting = dfa.states.filter((state) => state.isAccepting);
    const expected = [...new Set(originalAccepting.flatMap((state) => state.nfaStates))].sort(
      (a, b) => a - b
    );
    expect(mergedAccepting?.nfaStates).toEqual(expected);
  });

  it('keeps every subset ascending and duplicate-free', () => {
    for (const regex of EXPRESSIONS) {
      for (const state of minimizeDfa(buildDfa(regex)).states) {
        expect(state.nfaStates).toEqual([...new Set(state.nfaStates)]);
        expect(state.nfaStates).toEqual([...state.nfaStates].sort((a, b) => a - b));
      }
    }
  });
});

describe('language preservation', () => {
  it.each(EXPRESSIONS)('%s accepts exactly what the unminimized DFA accepts', (regex) => {
    const dfa = buildDfa(regex);
    const minimized = minimizeDfa(dfa);

    for (const input of allStringsUpTo(dfa.alphabet, 4)) {
      expect({ input, accepted: dfaAccepts(minimized, input) }).toEqual({
        input,
        accepted: dfaAccepts(dfa, input),
      });
    }
  });
});

/** Builds a DFA literally, for cases subset construction never produces. */
function handBuilt(
  states: [number, boolean][],
  transitions: [number, string, number][],
  alphabet: string[]
): DFA {
  return {
    states: states.map(([id, isAccepting]) => ({ id, nfaStates: [id], isAccepting })),
    alphabet,
    startState: states[0][0],
    acceptStates: states.filter(([, isAccepting]) => isAccepting).map(([id]) => id),
    transitions: transitions.map(([from, symbol, to]) => ({ from, to, symbol })),
  };
}

describe('unreachable states', () => {
  it('removes a state that cannot be reached from the start', () => {
    // 2 is an island: nothing leads to it.
    const dfa = handBuilt(
      [
        [0, false],
        [1, true],
        [2, true],
      ],
      [
        [0, 'a', 1],
        [2, 'a', 1],
      ],
      ['a']
    );
    const minimized = minimizeDfa(dfa);
    expect(minimized.states).toHaveLength(2);
    expect(dfaAccepts(minimized, 'a')).toBe(true);
    expect(dfaAccepts(minimized, '')).toBe(false);
  });

  it('removes a whole unreachable component', () => {
    const dfa = handBuilt(
      [
        [0, false],
        [1, true],
        [2, false],
        [3, true],
      ],
      [
        [0, 'a', 1],
        [2, 'a', 3],
        [3, 'a', 2],
      ],
      ['a']
    );
    expect(minimizeDfa(dfa).states).toHaveLength(2);
  });
});

describe('dead states', () => {
  it('removes a non-accepting sink, because a missing transition already rejects', () => {
    // 2 is a trap: reachable, but no accepting state is reachable from it.
    const dfa = handBuilt(
      [
        [0, false],
        [1, true],
        [2, false],
      ],
      [
        [0, 'a', 1],
        [0, 'b', 2],
        [2, 'a', 2],
        [2, 'b', 2],
      ],
      ['a', 'b']
    );
    const minimized = minimizeDfa(dfa);
    expect(minimized.states).toHaveLength(2);
    expect(minimized.transitions.some((t) => t.symbol === 'b')).toBe(false);
    expect(dfaAccepts(minimized, 'a')).toBe(true);
    expect(dfaAccepts(minimized, 'b')).toBe(false);
  });

  it('returns a single non-accepting state when the language is empty', () => {
    const dfa = handBuilt(
      [
        [0, false],
        [1, false],
      ],
      [[0, 'a', 1]],
      ['a']
    );
    const minimized = minimizeDfa(dfa);
    expect(minimized.states).toHaveLength(1);
    expect(minimized.acceptStates).toEqual([]);
    expect(minimized.transitions).toEqual([]);
    expect(dfaAccepts(minimized, '')).toBe(false);
    expect(dfaAccepts(minimized, 'a')).toBe(false);
  });
});

describe('refinement that needs more than one round', () => {
  it('separates states that only differ two symbols deep', () => {
    // 0 and 3 both go somewhere non-accepting on "a", but what happens next
    // differs, so the first round cannot tell them apart.
    const dfa = handBuilt(
      [
        [0, false],
        [1, false],
        [2, true],
        [3, false],
        [4, false],
        [5, true],
      ],
      [
        [0, 'a', 1],
        [1, 'a', 2],
        [3, 'a', 4],
        [4, 'a', 4],
        [4, 'b', 5],
      ],
      ['a', 'b']
    );
    const minimized = minimizeDfa(dfa);
    // Only the component reachable from 0 survives: 0 -a-> 1 -a-> 2.
    expect(minimized.states).toHaveLength(3);
    expect(dfaAccepts(minimized, 'aa')).toBe(true);
    expect(dfaAccepts(minimized, 'a')).toBe(false);
  });

  it('merges states distinguishable only by unreachable suffixes', () => {
    // 1 and 2 behave identically: both accept and both loop on "a".
    const dfa = handBuilt(
      [
        [0, false],
        [1, true],
        [2, true],
      ],
      [
        [0, 'a', 1],
        [1, 'a', 2],
        [2, 'a', 1],
      ],
      ['a']
    );
    const minimized = minimizeDfa(dfa);
    expect(minimized.states).toHaveLength(2);
    for (const input of ['', 'a', 'aa', 'aaa', 'aaaa']) {
      expect({ input, accepted: dfaAccepts(minimized, input) }).toEqual({
        input,
        accepted: dfaAccepts(dfa, input),
      });
    }
  });

  it('keeps distinguishable states apart', () => {
    // Accepts exactly "aa": no two states are equivalent.
    const dfa = handBuilt(
      [
        [0, false],
        [1, false],
        [2, true],
      ],
      [
        [0, 'a', 1],
        [1, 'a', 2],
      ],
      ['a']
    );
    expect(minimizeDfa(dfa).states).toHaveLength(3);
  });
});
