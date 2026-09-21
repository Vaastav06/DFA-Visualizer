/**
 * Stage 7 — Subset construction (epsilon-NFA -> DFA).
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

import { InternalCompilerError } from './errors';
import type { DFA, NFA } from './types';

/** Converts an epsilon-NFA into an equivalent DFA. */
export function subsetConstruction(nfa: NFA): DFA {
  throw new InternalCompilerError(
    'Subset construction is not implemented yet.',
    `TODO(Person 1): implement subsetConstruction() in src/compiler/subsetConstruction.ts. NFA has ${nfa.states.length} states.`
  );
}
