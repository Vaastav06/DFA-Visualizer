/**
 * Shared helpers for the compiler test suite.
 *
 * These exist so language-level tests can compare what the NFA accepts with
 * what the DFA and the minimized DFA accept. That comparison is the strongest
 * check in the suite: it catches subset-construction and minimization bugs
 * that structural assertions miss.
 */

import { simulate } from '../../../src/compiler/simulator';
import type { DFA, NFA } from '../../../src/compiler/types';

/** Convenience wrapper so tests read the same way for both automaton kinds. */
export function dfaAccepts(dfa: DFA, input: string): boolean {
  return simulate(dfa, input).accepted;
}

/** Every string over `alphabet` up to `maxLength`, shortest first. */
export function allStringsUpTo(alphabet: string[], maxLength: number): string[] {
  const strings: string[] = [''];
  let frontier: string[] = [''];

  for (let length = 1; length <= maxLength; length += 1) {
    const next: string[] = [];
    for (const prefix of frontier) {
      for (const symbol of alphabet) {
        const candidate = prefix + symbol;
        next.push(candidate);
        strings.push(candidate);
      }
    }
    frontier = next;
  }

  return strings;
}

/** Throws unless every structural invariant in docs/DATA_CONTRACTS.md holds. */
export function assertNfaInvariants(nfa: NFA): void {
  const states = new Set(nfa.states);

  if (!states.has(nfa.startState)) {
    throw new Error(`start state ${nfa.startState} is not in states`);
  }
  for (const id of nfa.acceptStates) {
    if (!states.has(id)) {
      throw new Error(`accept state ${id} is not in states`);
    }
  }
  for (const transition of nfa.transitions) {
    if (!states.has(transition.from) || !states.has(transition.to)) {
      throw new Error(`transition ${transition.from}->${transition.to} references a missing state`);
    }
    if (transition.symbol !== null && !nfa.alphabet.includes(transition.symbol)) {
      throw new Error(`transition symbol ${transition.symbol} is not in the alphabet`);
    }
  }
  for (const symbol of nfa.alphabet) {
    if (symbol === null || '|*.()'.includes(symbol)) {
      throw new Error(`alphabet contains the non-symbol ${JSON.stringify(symbol)}`);
    }
  }
}

/** Throws unless every structural invariant of a DFA holds. */
export function assertDfaInvariants(dfa: DFA): void {
  const ids = dfa.states.map((state) => state.id);
  const states = new Set(ids);

  if (new Set(ids).size !== ids.length) {
    throw new Error('duplicate DFA state ids');
  }
  if (dfa.states.length > 0 && !states.has(dfa.startState)) {
    throw new Error(`start state ${dfa.startState} is not in states`);
  }

  const declaredAccepting = [...dfa.acceptStates].sort((a, b) => a - b);
  const flaggedAccepting = dfa.states
    .filter((state) => state.isAccepting)
    .map((state) => state.id)
    .sort((a, b) => a - b);
  if (JSON.stringify(declaredAccepting) !== JSON.stringify(flaggedAccepting)) {
    throw new Error('acceptStates disagrees with the isAccepting flags');
  }

  const seen = new Set<string>();
  for (const transition of dfa.transitions) {
    if (transition.symbol === null) {
      throw new Error('a DFA must not contain epsilon transitions');
    }
    if (!states.has(transition.from) || !states.has(transition.to)) {
      throw new Error(`transition ${transition.from}->${transition.to} references a missing state`);
    }
    const key = `${transition.from}:${transition.symbol}`;
    if (seen.has(key)) {
      throw new Error(`state ${transition.from} has two transitions on ${transition.symbol}`);
    }
    seen.add(key);
  }
}

/** Throws unless state ids are exactly 0..n-1 and state 0 is the start state. */
export function assertDenseIds(dfa: DFA): void {
  const ids = dfa.states.map((state) => state.id).sort((a, b) => a - b);
  const expected = Array.from({ length: dfa.states.length }, (_, index) => index);
  if (JSON.stringify(ids) !== JSON.stringify(expected)) {
    throw new Error(`state ids are not dense: ${JSON.stringify(ids)}`);
  }
  if (dfa.states.length > 0 && dfa.startState !== 0) {
    throw new Error(`start state should be 0, found ${dfa.startState}`);
  }
}
