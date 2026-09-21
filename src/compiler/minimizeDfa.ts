/**
 * Stage 8 — DFA minimization.
 *
 * OWNER: Person 1.
 * CONTRACT: returns a NEW `DFA` recognising exactly the same language, with no
 * unreachable states and no two distinguishable-equivalent states.
 *
 * Suggested approach: remove unreachable states, then Hopcroft or the
 * partition-refinement table-filling method. Whichever you pick, document it in
 * docs/COMPILER_PIPELINE.md and in `CompilationResult.steps`.
 *
 * Output invariants:
 *  - the input DFA is not mutated
 *  - minimized state ids are renumbered 0..m-1; state 0 is the start state
 *  - `DFAState.nfaStates` of a merged state is the union of its members'
 *    `nfaStates` (ascending, unique), so the mapping table still means something
 */

import { InternalCompilerError } from './errors';
import type { DFA } from './types';

/** Returns a minimized copy of `dfa`. */
export function minimizeDfa(dfa: DFA): DFA {
  throw new InternalCompilerError(
    'DFA minimization is not implemented yet.',
    `TODO(Person 1): implement minimizeDfa() in src/compiler/minimizeDfa.ts. DFA has ${dfa.states.length} states.`
  );
}
