/**
 * Stage 5 - Thompson's construction.
 *
 * Asserts structural invariants and the LANGUAGE the NFA recognises, not the
 * exact state numbering. Allocation order is an implementation detail Person 1
 * must stay free to change; the language is what has to be right.
 */

import { describe, expect, it } from 'vitest';
import { thompsonConstruction } from '../../src/compiler/thompson';
import { infixToPostfix } from '../../src/compiler/infixToPostfix';
import { insertExplicitConcatenation } from '../../src/compiler/explicitConcatenation';
import { tokenize } from '../../src/compiler/tokenizer';
import { assertNfaInvariants, nfaAccepts } from './support/automata';
import type { NFA } from '../../src/compiler/types';

/** Builds the eps-NFA for a regex by running stages 2 to 5. */
function build(regex: string): NFA {
  return thompsonConstruction(infixToPostfix(insertExplicitConcatenation(tokenize(regex))));
}

const EXPRESSIONS = ['a', 'a|b', 'ab', 'a*', '(a|b)*', '(a|b)*abb', 'a(b|c)*', '(a|b)(c|d)'];

describe('structural invariants', () => {
  it.each(EXPRESSIONS)('%s produces a well-formed NFA', (regex) => {
    expect(() => assertNfaInvariants(build(regex))).not.toThrow();
  });

  it.each(EXPRESSIONS)('%s has exactly one accept state', (regex) => {
    expect(build(regex).acceptStates).toHaveLength(1);
  });

  it.each(EXPRESSIONS)('%s numbers its states 0..n-1', (regex) => {
    const nfa = build(regex);
    expect(nfa.states).toEqual(Array.from({ length: nfa.states.length }, (_, i) => i));
  });

  it('keeps operators out of the alphabet', () => {
    const nfa = build('(a|b)*abb');
    expect(nfa.alphabet).toEqual(['a', 'b']);
    for (const operator of ['|', '*', '.', '(', ')']) {
      expect(nfa.alphabet).not.toContain(operator);
    }
  });

  it('never puts epsilon in the alphabet', () => {
    const nfa = build('a*');
    expect(nfa.alphabet).not.toContain(null);
    expect(nfa.alphabet).not.toContain('ε');
  });

  it('uses null for epsilon transitions', () => {
    const nfa = build('a|b');
    const epsilons = nfa.transitions.filter((t) => t.symbol === null);
    expect(epsilons.length).toBeGreaterThan(0);
    for (const transition of epsilons) {
      expect(transition.symbol).toBeNull();
    }
  });
});

describe('the construction rules', () => {
  it('builds a single symbol transition for a literal', () => {
    const nfa = build('a');
    expect(nfa.states).toHaveLength(2);
    expect(nfa.transitions).toEqual([{ from: 0, to: 1, symbol: 'a' }]);
    expect(nfa.startState).toBe(0);
    expect(nfa.acceptStates).toEqual([1]);
  });

  it('joins concatenated fragments with one epsilon transition', () => {
    // Two literal fragments (2 states each) and no new states for the join.
    const nfa = build('ab');
    expect(nfa.states).toHaveLength(4);
    expect(nfa.transitions.filter((t) => t.symbol === null)).toHaveLength(1);
  });

  it('adds a new start and accept state for a union', () => {
    // Two literal fragments (4 states) plus the union's own two.
    const nfa = build('a|b');
    expect(nfa.states).toHaveLength(6);
    expect(nfa.transitions.filter((t) => t.symbol === null)).toHaveLength(4);
  });

  it('adds a new start and accept state and a loop for a star', () => {
    // One literal fragment (2 states) plus the star's own two.
    const nfa = build('a*');
    expect(nfa.states).toHaveLength(4);
    expect(nfa.transitions.filter((t) => t.symbol === null)).toHaveLength(4);
  });

  it('grows linearly with the size of the expression', () => {
    expect(build('a').states).toHaveLength(2);
    expect(build('ab').states).toHaveLength(4);
    expect(build('abc').states).toHaveLength(6);
    expect(build('abcd').states).toHaveLength(8);
  });
});

describe('the language the NFA recognises', () => {
  const cases: [string, string[], string[]][] = [
    ['a', ['a'], ['', 'b', 'aa']],
    ['a|b', ['a', 'b'], ['', 'ab', 'c', 'aa']],
    ['ab', ['ab'], ['', 'a', 'b', 'aba', 'abb']],
    ['a*', ['', 'a', 'aa', 'aaaa'], ['b', 'ab', 'ba']],
    ['(a|b)*', ['', 'a', 'b', 'ab', 'ba', 'abba'], ['c', 'abc']],
    ['(a|b)*abb', ['abb', 'aabb', 'babb', 'abbabb'], ['', 'a', 'ab', 'abba', 'bb']],
    ['a(b|c)*', ['a', 'ab', 'ac', 'abc', 'acbb'], ['', 'b', 'c', 'ba', 'abca']],
    ['(a|b)(c|d)', ['ac', 'ad', 'bc', 'bd'], ['', 'a', 'c', 'ab', 'acd']],
    ['abc', ['abc'], ['', 'ab', 'abcd', 'acb']],
    ['a|b|c', ['a', 'b', 'c'], ['', 'ab', 'd']],
    ['(ab)*', ['', 'ab', 'abab'], ['a', 'b', 'aba', 'ba']],
    ['a*b*', ['', 'a', 'b', 'ab', 'aabb'], ['ba', 'aba']],
  ];

  it.each(cases)('%s accepts the right strings', (regex, accepted) => {
    const nfa = build(regex);
    for (const input of accepted) {
      expect({ input, accepted: nfaAccepts(nfa, input) }).toEqual({ input, accepted: true });
    }
  });

  it.each(cases)('%s rejects the right strings', (regex, _accepted, rejected) => {
    const nfa = build(regex);
    for (const input of rejected) {
      expect({ input, accepted: nfaAccepts(nfa, input) }).toEqual({ input, accepted: false });
    }
  });

  it('accepts the empty string only where the expression allows it', () => {
    expect(nfaAccepts(build('a*'), '')).toBe(true);
    expect(nfaAccepts(build('(a|b)*'), '')).toBe(true);
    expect(nfaAccepts(build('a'), '')).toBe(false);
    expect(nfaAccepts(build('ab'), '')).toBe(false);
  });
});

describe('determinism', () => {
  it('produces an identical NFA for the same expression every time', () => {
    expect(build('(a|b)*abb')).toEqual(build('(a|b)*abb'));
  });

  it('numbers states by allocation order, independent of the symbols used', () => {
    const first = build('a|b');
    const second = build('c|d');
    expect(first.states).toEqual(second.states);
    expect(first.startState).toBe(second.startState);
    expect(first.acceptStates).toEqual(second.acceptStates);
  });
});
