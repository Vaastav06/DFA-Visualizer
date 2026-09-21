/**
 * Stage 7 - Subset construction (epsilon-NFA -> DFA).
 *
 * OWNER: Person 1.
 * CONTRACT: each DFA state corresponds to one epsilon-closed set of NFA states,
 * recorded in `DFAState.nfaStates` (ascending, unique). The UI's "DFA mapping"
 * table and the visualization tooltips read that array, so it must be accurate.
 *
 * Output invariants:
 *  - DFA state ids are 0..n-1 in discovery order; state 0 is the start state
 *  - a DFA state accepts iff its `nfaStates` contains an NFA accept state
 *  - no epsilon transitions in the output
 *  - the empty set is NOT materialised as a dead state (see
 *    docs/COMPILER_PIPELINE.md); a missing transition means "reject"
 */

import { epsilonClosure, move, stateSetKey } from './epsilonClosure';
import type { DFA, DFAState, NFA, Transition } from './types';

/** Converts an epsilon-NFA into an equivalent DFA. */
export function subsetConstruction(nfa: NFA): DFA {
  const acceptingNfaStates = new Set(nfa.acceptStates);

  // Canonical key -> DFA state id. The key is what stops two orderings of the
  // same subset becoming two different DFA states.
  const idByKey = new Map<string, number>();
  const states: DFAState[] = [];
  const transitions: Transition[] = [];

  /** Returns the id of the DFA state for `subset`, creating it if it is new. */
  const intern = (subset: number[]): number => {
    const key = stateSetKey(subset);
    const existing = idByKey.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const id = states.length;
    idByKey.set(key, id);
    states.push({
      id,
      nfaStates: subset,
      // A subset accepts exactly when it contains at least one NFA accept
      // state - never hard-coded, always derived.
      isAccepting: subset.some((state) => acceptingNfaStates.has(state)),
    });
    return id;
  };

  const startSubset = epsilonClosure(nfa, [nfa.startState]);
  intern(startSubset);

  // Breadth-first over subsets. `states` doubles as the worklist: anything
  // appended during the loop is visited before the loop ends, and each subset
  // is expanded exactly once because `intern` deduplicates by key.
  for (let index = 0; index < states.length; index += 1) {
    const current = states[index];

    // The alphabet is already sorted, so transitions come out in a stable
    // order and the ids assigned to newly discovered subsets are deterministic.
    for (const symbol of nfa.alphabet) {
      const target = epsilonClosure(nfa, move(nfa, current.nfaStates, symbol));

      // The empty subset is the dead state. Per docs/DECISIONS.md D-006 it is
      // not materialised: a missing transition already means "reject".
      if (target.length === 0) {
        continue;
      }

      transitions.push({ from: current.id, to: intern(target), symbol });
    }
  }

  return {
    states,
    alphabet: [...nfa.alphabet],
    startState: 0,
    acceptStates: states.filter((state) => state.isAccepting).map((state) => state.id),
    transitions,
  };
}
