/**
 * Stage 9 - String simulation.
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
 *  - never throws for ordinary rejection - rejection is a result, not an error
 */

import type { DFA, SimulationResult, SimulationStep, Transition } from './types';

/** Lookup from "state:symbol" to the target state, built once per run. */
function buildTransitionTable(transitions: Transition[]): Map<string, number> {
  const table = new Map<string, number>();

  for (const transition of transitions) {
    // A DFA has no epsilon transitions; if one appears the automaton is not
    // deterministic and the entry is deliberately skipped rather than used.
    if (transition.symbol === null) {
      continue;
    }
    table.set(`${transition.from}:${transition.symbol}`, transition.to);
  }

  return table;
}

/** Runs `input` through `dfa` and returns the full trace. */
export function simulate(dfa: DFA, input: string): SimulationResult {
  const table = buildTransitionTable(dfa.transitions);
  const acceptStates = new Set(dfa.acceptStates);
  const alphabet = new Set(dfa.alphabet);

  const steps: SimulationStep[] = [];
  const path: number[] = [dfa.startState];
  let current = dfa.startState;
  let index = 0;

  for (const symbol of input) {
    // A symbol outside the alphabet can have no transition by definition, but
    // checking it explicitly keeps the two rejection reasons distinguishable
    // to anyone reading the trace.
    const target = alphabet.has(symbol) ? table.get(`${current}:${symbol}`) : undefined;

    if (target === undefined) {
      const error = !alphabet.has(symbol)
        ? `Symbol "${symbol}" is not in the alphabet { ${[...alphabet].join(', ')} }.`
        : `No transition from state q${current} on symbol "${symbol}".`;

      steps.push({ index, symbol, fromState: current, toState: null });
      return { input, accepted: false, steps, path, consumed: index, error, rejectedAt: index };
    }

    steps.push({ index, symbol, fromState: current, toState: target });
    path.push(target);
    current = target;
    index += 1;
  }

  // The whole input was consumed. Acceptance is now purely about where we
  // ended up, which is also what makes the empty string work: the loop never
  // runs and `current` is still the start state.
  const accepted = acceptStates.has(current);
  const error = accepted
    ? undefined
    : `String was completely consumed but halted in non-accepting state q${current}.`;

  return { input, accepted, steps, path, consumed: input.length, error };
}

/** Alias for {@link simulate}. */
export const simulateDFA = simulate;

