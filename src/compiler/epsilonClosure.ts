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

import { InternalCompilerError } from './errors';
import type { NFA } from './types';

/** Epsilon closure of a set of NFA states. Returns a sorted, unique array. */
export function epsilonClosure(nfa: NFA, states: number[]): number[] {
  throw new InternalCompilerError(
    'Epsilon closure is not implemented yet.',
    `TODO(Person 1): implement epsilonClosure() in src/compiler/epsilonClosure.ts. Received ${states.length} states, NFA has ${nfa.states.length}.`
  );
}

/** States reachable from `states` on exactly one `symbol`. Sorted and unique. */
export function move(nfa: NFA, states: number[], symbol: string): number[] {
  throw new InternalCompilerError(
    'move() is not implemented yet.',
    `TODO(Person 1): implement move() in src/compiler/epsilonClosure.ts. Symbol: ${symbol}, ${states.length} of ${nfa.states.length} states.`
  );
}

/** Canonical string key for a state set. Use for the subset-construction map. */
export function stateSetKey(states: number[]): string {
  return [...new Set(states)].sort((a, b) => a - b).join(',');
}
