/**
 * Tests for deterministic BFS layered layout.
 *
 * OWNER: Person 2.
 */

import { describe, expect, it } from 'vitest';
import { layoutAutomaton } from '../../src/visualization/layout/graphLayout';
import { MOCK_DFA, MOCK_DFA_WITH_SELF_LOOP, MOCK_NFA } from '../fixtures/mockAutomata';

describe('layoutAutomaton', () => {
  it('returns an empty map for empty states', () => {
    const result = layoutAutomaton([], [], 0);
    expect(result.size).toBe(0);
  });

  it('is completely deterministic across multiple runs', () => {
    const run1 = layoutAutomaton(MOCK_NFA.states, MOCK_NFA.transitions, MOCK_NFA.startState);
    const run2 = layoutAutomaton(MOCK_NFA.states, MOCK_NFA.transitions, MOCK_NFA.startState);

    expect(run1.size).toBe(run2.size);
    for (const [stateId, pos1] of run1.entries()) {
      const pos2 = run2.get(stateId);
      expect(pos2).toBeDefined();
      expect(pos1.x).toBe(pos2!.x);
      expect(pos1.y).toBe(pos2!.y);
    }
  });

  it('places start state at layer 0 (leftmost in LR)', () => {
    const layout = layoutAutomaton(
      MOCK_DFA.states.map((s) => s.id),
      MOCK_DFA.transitions,
      MOCK_DFA.startState
    );
    const startPos = layout.get(0)!;
    expect(startPos).toBeDefined();

    // Outgoing targets (states 1 and 2) should have higher x than state 0
    const pos1 = layout.get(1)!;
    const pos2 = layout.get(2)!;
    expect(pos1.x).toBeGreaterThan(startPos.x);
    expect(pos2.x).toBeGreaterThan(startPos.x);
  });

  it('handles self-loops without displacing nodes into new layers', () => {
    const layout = layoutAutomaton(
      MOCK_DFA_WITH_SELF_LOOP.states.map((s) => s.id),
      MOCK_DFA_WITH_SELF_LOOP.transitions,
      MOCK_DFA_WITH_SELF_LOOP.startState
    );
    expect(layout.size).toBe(1);
    expect(layout.get(0)).toBeDefined();
  });

  it('handles cycles and back-edges cleanly', () => {
    const states = [0, 1, 2];
    const transitions = [
      { from: 0, to: 1, symbol: 'a' },
      { from: 1, to: 2, symbol: 'b' },
      { from: 2, to: 0, symbol: 'a' }, // back-edge to start state
      { from: 1, to: 1, symbol: 'b' }, // self loop
    ];

    const layout = layoutAutomaton(states, transitions, 0);
    expect(layout.size).toBe(3);
    const p0 = layout.get(0)!;
    const p1 = layout.get(1)!;
    const p2 = layout.get(2)!;

    expect(p1.x).toBeGreaterThan(p0.x);
    expect(p2.x).toBeGreaterThan(p1.x);
  });

  it('places unreachable states deterministically without throwing', () => {
    const states = [0, 1, 99];
    const transitions = [{ from: 0, to: 1, symbol: 'a' }]; // state 99 is unreachable

    const layout = layoutAutomaton(states, transitions, 0);
    expect(layout.size).toBe(3);
    expect(layout.get(99)).toBeDefined();
  });

  it('supports TB (top-to-bottom) direction', () => {
    const layout = layoutAutomaton(
      MOCK_DFA.states.map((s) => s.id),
      MOCK_DFA.transitions,
      MOCK_DFA.startState,
      { rankSpacing: 150, nodeSpacing: 80, direction: 'TB' }
    );

    const startPos = layout.get(0)!;
    const pos1 = layout.get(1)!;
    expect(pos1.y).toBeGreaterThan(startPos.y);
  });
});
