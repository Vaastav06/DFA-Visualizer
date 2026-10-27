import { describe, expect, it } from 'vitest';
import { MOCK_DFA } from '../fixtures/mockAutomata';
import { compileRegex } from '../../src/compiler';

describe('direct DFA contract', () => {
  it('uses non-negative integer state ids and starts at q0', () => {
    expect(MOCK_DFA.states.every((s) => Number.isInteger(s.id) && s.id >= 0)).toBe(true);
    expect(MOCK_DFA.startState).toBe(0);
  });

  it('keeps accepting-state flags consistent and transitions deterministic', () => {
    const dfa = compileRegex('(a|b)*abb').dfa;
    expect(dfa.acceptStates.sort()).toEqual(
      dfa.states.filter((s) => s.isAccepting).map((s) => s.id)
    );
    const seen = new Set<string>();
    for (const transition of dfa.transitions) {
      const key = `${transition.from}:${transition.symbol}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('stores syntax-tree positions on every direct DFA state', () => {
    expect(compileRegex('(a|b)*abb').dfa.states.every((s) => s.positions.length > 0)).toBe(true);
  });
});
