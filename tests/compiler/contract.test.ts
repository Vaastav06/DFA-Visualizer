/**
 * Seed test for tests/compiler/ — OWNER: Person 1.
 *
 * It deliberately tests the SHARED CONTRACT and the fixtures, not any
 * algorithm, so it passes today and keeps passing once the compiler lands.
 * Person 1 replaces/extends this directory with real algorithm tests
 * (validator.test.ts, tokenizer.test.ts, thompson.test.ts, ...).
 */

import { describe, expect, it } from 'vitest';
import { EPSILON, EPSILON_DISPLAY } from '../../src/compiler/types';
import { MOCK_DFA, MOCK_MINIMIZED_DFA, MOCK_NFA } from '../fixtures/mockAutomata';

describe('epsilon contract', () => {
  it('represents epsilon as null internally', () => {
    expect(EPSILON).toBeNull();
  });

  it('keeps the display glyph out of the data', () => {
    expect(EPSILON_DISPLAY).toBe('ε');
    expect(MOCK_NFA.alphabet).not.toContain(EPSILON_DISPLAY);
  });

  it('allows epsilon transitions in an NFA', () => {
    expect(MOCK_NFA.transitions.some((t) => t.symbol === null)).toBe(true);
  });

  it('forbids epsilon transitions in a DFA', () => {
    for (const dfa of [MOCK_DFA, MOCK_MINIMIZED_DFA]) {
      expect(dfa.transitions.every((t) => t.symbol !== null)).toBe(true);
    }
  });
});

describe('state id contract', () => {
  it('uses non-negative integers for NFA state ids', () => {
    expect(MOCK_NFA.states.every((id) => Number.isInteger(id) && id >= 0)).toBe(true);
  });

  it('uses non-negative integers for DFA state ids', () => {
    expect(MOCK_DFA.states.every((s) => Number.isInteger(s.id) && s.id >= 0)).toBe(true);
  });
});

describe('automaton invariants hold for the fixtures', () => {
  it('NFA: start and accept states exist, transitions stay in range', () => {
    const states = new Set(MOCK_NFA.states);
    expect(states.has(MOCK_NFA.startState)).toBe(true);
    expect(MOCK_NFA.acceptStates.every((id) => states.has(id))).toBe(true);
    expect(MOCK_NFA.transitions.every((t) => states.has(t.from) && states.has(t.to))).toBe(true);
  });

  it('DFA: acceptStates agrees with isAccepting, and transitions are deterministic', () => {
    for (const dfa of [MOCK_DFA, MOCK_MINIMIZED_DFA]) {
      const accepting = dfa.states.filter((s) => s.isAccepting).map((s) => s.id);
      expect([...dfa.acceptStates].sort()).toEqual([...accepting].sort());

      const seen = new Set<string>();
      for (const t of dfa.transitions) {
        const key = t.from + ':' + t.symbol;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it('DFA states record the positions / subsets they represent', () => {
    expect(
      MOCK_DFA.states.every((s) => s.positions.length > 0 && (s.nfaStates?.length ?? 0) > 0)
    ).toBe(true);
  });

  it('minimization does not grow the automaton', () => {
    expect(MOCK_MINIMIZED_DFA.states.length).toBeLessThanOrEqual(MOCK_DFA.states.length);
  });
});
