/**
 * Stage 9 — String simulation.
 *
 * OWNER: Person 1.
 * CONTRACT: runs `input` through `dfa` one character at a time and records a
 * full trace. The UI replays `steps`/`path` to animate the run, so the trace
 * must be complete even when the string is rejected.
 *
 * Rules:
 *  - the empty string is legal input; it is accepted iff the start state accepts
 *  - a character outside `dfa.alphabet`, or a state with no transition on the
 *    character, stops the run: `accepted: false` and `rejectedAt` set to the
 *    index of that character
 *  - `path[0]` is always `dfa.startState`
 *  - never throws for ordinary rejection — rejection is a result, not an error
 */

import { InternalCompilerError } from './errors';
import type { DFA, SimulationResult } from './types';

/** Runs `input` through `dfa` and returns the full trace. */
export function simulate(dfa: DFA, input: string): SimulationResult {
  throw new InternalCompilerError(
    'String simulation is not implemented yet.',
    `TODO(Person 1): implement simulate() in src/compiler/simulator.ts. DFA has ${dfa.states.length} states, input ${JSON.stringify(input)}.`
  );
}
