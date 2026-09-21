/**
 * Stage 7 - subset construction.
 *
 * The key correctness check is language equivalence with the NFA it came from:
 * a structural bug that a spot-check misses will show up as a string the two
 * automata disagree about.
 */

import { describe, expect, it } from 'vitest';
import { subsetConstruction } from '../../src/compiler/subsetConstruction';
import { thompsonConstruction } from '../../src/compiler/thompson';
import { infixToPostfix } from '../../src/compiler/infixToPostfix';
import { insertExplicitConcatenation } from '../../src/compiler/explicitConcatenation';
import { tokenize } from '../../src/compiler/tokenizer';
import { stateSetKey } from '../../src/compiler/epsilonClosure';
import {
  allStringsUpTo,
  assertDenseIds,
  assertDfaInvariants,
  dfaAccepts,
  nfaAccepts,
} from './support/automata';
import type { DFA, NFA } from '../../src/compiler/types';

function buildNfa(regex: string): NFA {
  return thompsonConstruction(infixToPostfix(insertExplicitConcatenation(tokenize(regex))));
}

function buildDfa(regex: string): DFA {
  return subsetConstruction(buildNfa(regex));
}

const EXPRESSIONS = ['a', 'a|b', 'ab', 'a*', '(a|b)*', '(a|b)*abb', 'a(b|c)*', '(a|b)(c|d)'];

describe('structural invariants', () => {
  it.each(EXPRESSIONS)('%s produces a well-formed DFA', (regex) => {
    expect(() => assertDfaInvariants(buildDfa(regex))).not.toThrow();
  });

  it.each(EXPRESSIONS)('%s numbers its states densely from the start state', (regex) => {
    expect(() => assertDenseIds(buildDfa(regex))).not.toThrow();
  });

  it.each(EXPRESSIONS)('%s produces no epsilon transitions', (regex) => {
    expect(buildDfa(regex).transitions.every((t) => t.symbol !== null)).toBe(true);
  });

  it.each(EXPRESSIONS)('%s is deterministic - one transition per state and symbol', (regex) => {
    const dfa = buildDfa(regex);
    const seen = new Set<string>();
    for (const transition of dfa.transitions) {
      const key = `${transition.from}:${transition.symbol}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('keeps the alphabet of the NFA it came from', () => {
    expect(buildDfa('(a|b)*abb').alphabet).toEqual(['a', 'b']);
    expect(buildDfa('(a|b)(c|d)').alphabet).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('the subset mapping', () => {
  it('starts from the epsilon closure of the NFA start state', () => {
    const nfa = buildNfa('a|b');
    const dfa = subsetConstruction(nfa);
    // The union's start state reaches both branch starts by epsilon.
    expect(dfa.states[0].nfaStates).toContain(nfa.startState);
    expect(dfa.states[0].nfaStates.length).toBeGreaterThan(1);
  });

  it('records a non-empty, ascending, duplicate-free subset on every state', () => {
    for (const regex of EXPRESSIONS) {
      for (const state of buildDfa(regex).states) {
        expect(state.nfaStates.length).toBeGreaterThan(0);
        expect(state.nfaStates).toEqual([...new Set(state.nfaStates)]);
        expect(state.nfaStates).toEqual([...state.nfaStates].sort((a, b) => a - b));
      }
    }
  });

  it('never creates two states for the same subset', () => {
    for (const regex of EXPRESSIONS) {
      const keys = buildDfa(regex).states.map((state) => stateSetKey(state.nfaStates));
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('marks a state accepting exactly when its subset contains an NFA accept state', () => {
    const nfa = buildNfa('(a|b)*abb');
    const dfa = subsetConstruction(nfa);
    const accepting = new Set(nfa.acceptStates);
    for (const state of dfa.states) {
      expect(state.isAccepting).toBe(state.nfaStates.some((id) => accepting.has(id)));
    }
  });

  it('builds the textbook 5-state DFA for (a|b)*abb', () => {
    // The dragon book's states A..E. Two of them are equivalent, which is what
    // minimization later merges to reach the minimal 4-state DFA.
    expect(buildDfa('(a|b)*abb').states).toHaveLength(5);
  });

  it('leaves a* with two states, both accepting, for minimization to merge', () => {
    const dfa = buildDfa('a*');
    expect(dfa.states).toHaveLength(2);
    expect(dfa.states.every((state) => state.isAccepting)).toBe(true);
  });

  it('collapses a|b into three states', () => {
    // start, then one accepting state per branch.
    expect(buildDfa('a|b').states).toHaveLength(3);
  });
});

describe('the dead state is not materialised', () => {
  it('omits the transition rather than adding a trap state', () => {
    const dfa = buildDfa('ab');
    // From the start state, "b" leads nowhere, so there is no such transition.
    expect(dfa.transitions.some((t) => t.from === dfa.startState && t.symbol === 'b')).toBe(false);
  });

  it('leaves the DFA partial - fewer transitions than states times symbols', () => {
    const dfa = buildDfa('ab');
    expect(dfa.transitions.length).toBeLessThan(dfa.states.length * dfa.alphabet.length);
  });
});

describe('language equivalence with the NFA', () => {
  it.each(EXPRESSIONS)('%s accepts exactly what its NFA accepts', (regex) => {
    const nfa = buildNfa(regex);
    const dfa = subsetConstruction(nfa);

    for (const input of allStringsUpTo(dfa.alphabet, 4)) {
      expect({ input, accepted: dfaAccepts(dfa, input) }).toEqual({
        input,
        accepted: nfaAccepts(nfa, input),
      });
    }
  });
});

describe('determinism', () => {
  it('produces an identical DFA for the same expression every time', () => {
    expect(buildDfa('(a|b)*abb')).toEqual(buildDfa('(a|b)*abb'));
  });
});
