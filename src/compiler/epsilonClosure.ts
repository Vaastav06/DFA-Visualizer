/**
 * Stage 6 — Epsilon closure.
 *
 * OWNER: Person 1.
 * CONTRACT: pure set operations over an NFA. No mutation of the NFA.
 *
 * `epsilonClosure(nfa, states)` = every state reachable from `states` using
 * zero or more epsilon transitions, INCLUDING `states` themselves.
 *
 * `move(nfa, states, symbol)` = every state reachable from `states` by exactly
 * one transition on `symbol` (no epsilon steps).
 *
 * Both return ascending, duplicate-free arrays so that subset construction can
 * use the array as a stable set key.
 */

import type { NFA } from './types';
import { EPSILON } from './types';

/** Epsilon closure of a set of NFA states. Returns a sorted, unique array. */
export function epsilonClosure(nfa: NFA, states: number[]): number[] {
  const closure = new Set<number>(states);
  const stack = [...states];

  // Build epsilon transition map for fast lookup
  const epsilonMap = new Map<number, number[]>();
  for (const t of nfa.transitions) {
    if (t.symbol === EPSILON) {
      if (!epsilonMap.has(t.from)) {
        epsilonMap.set(t.from, []);
      }
      epsilonMap.get(t.from)!.push(t.to);
    }
  }

  while (stack.length > 0) {
    const state = stack.pop()!;
    const epsTransitions = epsilonMap.get(state) || [];
    for (const to of epsTransitions) {
      if (!closure.has(to)) {
        closure.add(to);
        stack.push(to);
      }
    }
  }

  return Array.from(closure).sort((a, b) => a - b);
}

/** States reachable from `states` on exactly one `symbol`. Sorted and unique. */
export function move(nfa: NFA, states: number[], symbol: string): number[] {
  const result = new Set<number>();

  for (const t of nfa.transitions) {
    if (t.symbol === symbol && states.includes(t.from)) {
      result.add(t.to);
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

/** Canonical string key for a state set. Use for the subset-construction map. */
export function stateSetKey(states: number[]): string {
  return [...new Set(states)].sort((a, b) => a - b).join(',');
}
