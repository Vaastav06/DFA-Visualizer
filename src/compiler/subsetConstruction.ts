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

import type { DFA, DFAState, NFA, Transition } from './types';
import { stateSetKey, epsilonClosure, move } from './epsilonClosure';

/** Converts an epsilon-NFA into an equivalent DFA. */
export function subsetConstruction(nfa: NFA): DFA {
  const dfaStates: DFAState[] = [];
  const dfaTransitions: Transition[] = [];
  const stateMap = new Map<string, number>(); // key -> dfa state id

  const startClosure = epsilonClosure(nfa, [nfa.startState]);
  const startKey = stateSetKey(startClosure);
  stateMap.set(startKey, 0);

  const isAccepting = startClosure.some(s => nfa.acceptStates.includes(s));
  dfaStates.push({
    id: 0,
    nfaStates: startClosure,
    isAccepting,
  });

  const queue: number[][] = [startClosure];

  while (queue.length > 0) {
    const currentNfaStates = queue.shift()!;
    const currentKey = stateSetKey(currentNfaStates);
    const currentDfaId = stateMap.get(currentKey)!;

    for (const symbol of nfa.alphabet) {
      const moveResult = move(nfa, currentNfaStates, symbol);
      if (moveResult.length === 0) {
        continue; // No transition on this symbol = reject (no dead state)
      }

      const closure = epsilonClosure(nfa, moveResult);
      const nextKey = stateSetKey(closure);

      let nextDfaId = stateMap.get(nextKey);
      if (nextDfaId === undefined) {
        nextDfaId = dfaStates.length;
        stateMap.set(nextKey, nextDfaId);
        const accepting = closure.some(s => nfa.acceptStates.includes(s));
        dfaStates.push({
          id: nextDfaId,
          nfaStates: closure,
          isAccepting: accepting,
        });
        queue.push(closure);
      }

      dfaTransitions.push({
        from: currentDfaId,
        to: nextDfaId,
        symbol,
      });
    }
  }

  const acceptStates = dfaStates.filter(s => s.isAccepting).map(s => s.id);

  return {
    states: dfaStates,
    alphabet: [...nfa.alphabet],
    startState: 0,
    acceptStates,
    transitions: dfaTransitions,
  };
}
