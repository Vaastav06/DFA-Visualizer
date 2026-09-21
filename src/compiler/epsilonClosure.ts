/**
 * Stage 6 - Epsilon closure.
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

import type { NFA, Transition } from './types';

/** Adjacency built once per closure/move run, so repeated calls stay cheap. */
type Adjacency = Map<number, Transition[]>;

function buildAdjacency(transitions: Transition[]): Adjacency {
  const adjacency: Adjacency = new Map();

  for (const transition of transitions) {
    const outgoing = adjacency.get(transition.from);
    if (outgoing === undefined) {
      adjacency.set(transition.from, [transition]);
    } else {
      outgoing.push(transition);
    }
  }

  return adjacency;
}

/** Ascending, duplicate-free array from a set of state ids. */
function sortedUnique(states: Iterable<number>): number[] {
  return [...new Set(states)].sort((a, b) => a - b);
}

/**
 * Epsilon closure of a set of NFA states. Returns a sorted, unique array.
 *
 * Depth-first traversal that follows only epsilon transitions, marking states
 * as it goes. The marking is what makes it terminate: `*` always introduces a
 * cycle of epsilon transitions, so an unmarked traversal would never stop.
 */
export function epsilonClosure(nfa: NFA, states: number[]): number[] {
  const adjacency = buildAdjacency(nfa.transitions);
  const closure = new Set<number>(states);
  const stack = [...new Set(states)];

  while (stack.length > 0) {
    const state = stack.pop() as number;

    for (const transition of adjacency.get(state) ?? []) {
      if (transition.symbol === null && !closure.has(transition.to)) {
        closure.add(transition.to);
        stack.push(transition.to);
      }
    }
  }

  return sortedUnique(closure);
}

/** States reachable from `states` on exactly one `symbol`. Sorted and unique. */
export function move(nfa: NFA, states: number[], symbol: string): number[] {
  const adjacency = buildAdjacency(nfa.transitions);
  const reached = new Set<number>();
  const sources = new Set(states);

  for (const state of sources) {
    for (const transition of adjacency.get(state) ?? []) {
      // `symbol` is never null here: epsilon is not part of the alphabet, so a
      // move on epsilon is meaningless. Closure is the operation for that.
      if (transition.symbol === symbol) {
        reached.add(transition.to);
      }
    }
  }

  return sortedUnique(reached);
}

/** Canonical string key for a state set. Use for the subset-construction map. */
export function stateSetKey(states: number[]): string {
  return [...new Set(states)].sort((a, b) => a - b).join(',');
}
