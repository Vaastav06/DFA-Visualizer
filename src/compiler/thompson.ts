/**
 * Stage 5 — Thompson's construction.
 *
 * OWNER: Person 1.
 * CONTRACT: builds an epsilon-NFA from the postfix token list.
 *
 * Structural rules (one start state, one accept state per fragment):
 *   literal a   start -a-> accept
 *   concat  st  accept(s) -ε-> start(t)
 *   union   s|t new start -ε-> start(s), start(t); both accepts -ε-> new accept
 *   star    s*  new start -ε-> start(s) and -ε-> new accept;
 *               accept(s) -ε-> start(s) and -ε-> new accept
 *
 * Output invariants:
 *  - state ids are 0..n-1, assigned in allocation order (STATE ID CONTRACT)
 *  - `acceptStates` has exactly one element
 *  - epsilon transitions use `symbol: null` (EPSILON CONTRACT)
 *  - `alphabet` lists the distinct literals only, never `null`
 */

import { InternalCompilerError } from './errors';
import type { NFA } from './types';

/** Builds an epsilon-NFA from a postfix token list. */
export function thompsonConstruction(postfix: string[]): NFA {
  throw new InternalCompilerError(
    "Thompson's construction is not implemented yet.",
    `TODO(Person 1): implement thompsonConstruction() in src/compiler/thompson.ts. Received ${postfix.length} tokens.`
  );
}
