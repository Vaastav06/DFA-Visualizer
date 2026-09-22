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

import type { DFA, SimulationResult, SimulationStep } from './types';

/** Runs `input` through `dfa` and returns the full trace. */
export function simulate(dfa: DFA, input: string): SimulationResult {
  // Build transition lookup: state -> symbol -> target state
  const transMap = new Map<number, Map<string, number>>();
  for (const t of dfa.transitions) {
    if (!transMap.has(t.from)) {
      transMap.set(t.from, new Map());
    }
    // DFA transitions never have null symbols (no epsilon in DFA)
    transMap.get(t.from)!.set(t.symbol as string, t.to);
  }

  const steps: SimulationStep[] = [];
  const path: number[] = [dfa.startState];
  let currentState = dfa.startState;
  let accepted = true;
  let rejectedAt: number | undefined;

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];

    // Check if symbol is in alphabet
    if (!dfa.alphabet.includes(symbol)) {
      accepted = false;
      rejectedAt = i;
      break;
    }

    const transitions = transMap.get(currentState);
    const nextState = transitions?.get(symbol);

    if (nextState === undefined) {
      // No transition on this symbol from current state
      steps.push({
        index: i,
        symbol,
        fromState: currentState,
        toState: null,
      });
      accepted = false;
      rejectedAt = i;
      break;
    }

    steps.push({
      index: i,
      symbol,
      fromState: currentState,
      toState: nextState,
    });

    currentState = nextState;
    path.push(currentState);
  }

  // If we consumed all input without rejecting, check if final state is accepting
  if (accepted && rejectedAt === undefined) {
    accepted = dfa.acceptStates.includes(currentState);
    if (!accepted) {
      rejectedAt = input.length;
    }
  }

  return {
    input,
    accepted,
    steps,
    path,
    rejectedAt,
  };
}
