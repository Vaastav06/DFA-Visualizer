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

import type { DFA, DFAState, Transition } from './types';

/** Returns a minimized copy of `dfa`. */
export function minimizeDfa(dfa: DFA): DFA {
  // Step 1: Remove unreachable states
  const reachable = findReachableStates(dfa);
  const reachableStates = dfa.states.filter(s => reachable.has(s.id));
  const reachableTransitions = dfa.transitions.filter(
    t => reachable.has(t.from) && reachable.has(t.to)
  );

  if (reachableStates.length === 0) {
    // Should not happen if start state is reachable
    return {
      states: [],
      alphabet: [...dfa.alphabet],
      startState: 0,
      acceptStates: [],
      transitions: [],
    };
  }

  // Step 2: Table-filling algorithm (Hopcroft-style partition refinement)
  // Two states are distinguishable if one is accepting and the other is not,
  // or if they have transitions on the same symbol to distinguishable states.

  const n = reachableStates.length;
  const stateIdToIndex = new Map<number, number>();
  reachableStates.forEach((s, i) => stateIdToIndex.set(s.id, i));

  // distinguishable[i][j] = true if states i and j are distinguishable
  const distinguishable = new Array(n).fill(null).map(() => new Array(n).fill(false));

  // Initialize: accepting vs non-accepting are distinguishable
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (reachableStates[i].isAccepting !== reachableStates[j].isAccepting) {
        distinguishable[i][j] = true;
        distinguishable[j][i] = true;
      }
    }
  }

  // Build transition table for quick lookup
  const transTable = new Map<number, Map<string, number>>();
  for (const t of reachableTransitions) {
    if (!transTable.has(t.from)) {
      transTable.set(t.from, new Map());
    }
    // DFA transitions never have null symbols (no epsilon in DFA)
    transTable.get(t.from)!.set(t.symbol as string, t.to);
  }

  // Iteratively mark distinguishable pairs
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (distinguishable[i][j]) continue;

        for (const symbol of dfa.alphabet) {
          const fromI = reachableStates[i].id;
          const fromJ = reachableStates[j].id;

          const toI = transTable.get(fromI)?.get(symbol);
          const toJ = transTable.get(fromJ)?.get(symbol);

          // If exactly one has a transition on this symbol, they are distinguishable
          if ((toI === undefined) !== (toJ === undefined)) {
            distinguishable[i][j] = true;
            distinguishable[j][i] = true;
            changed = true;
            break;
          }

          // If both have transitions, check if the target states are distinguishable
          if (toI !== undefined && toJ !== undefined) {
            const idxI = stateIdToIndex.get(toI)!;
            const idxJ = stateIdToIndex.get(toJ)!;
            const a = Math.min(idxI, idxJ);
            const b = Math.max(idxI, idxJ);
            if (distinguishable[a][b]) {
              distinguishable[i][j] = true;
              distinguishable[j][i] = true;
              changed = true;
              break;
            }
          }
        }
      }
    }
  }

  // Step 3: Build equivalence classes
  const equivalenceClass = new Array(n).fill(-1);
  let classCount = 0;
  for (let i = 0; i < n; i++) {
    if (equivalenceClass[i] === -1) {
      equivalenceClass[i] = classCount;
      for (let j = i + 1; j < n; j++) {
        if (!distinguishable[i][j]) {
          equivalenceClass[j] = classCount;
        }
      }
      classCount++;
    }
  }

  // Step 4: Build minimized DFA
  const classToNfaStates = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const cls = equivalenceClass[i];
    if (!classToNfaStates.has(cls)) {
      classToNfaStates.set(cls, []);
    }
    classToNfaStates.get(cls)!.push(...reachableStates[i].nfaStates);
  }

  // Merge and sort nfaStates for each class
  for (const [cls, states] of classToNfaStates) {
    classToNfaStates.set(cls, [...new Set(states)].sort((a, b) => a - b));
  }

  const newStates: DFAState[] = [];
  const classToNewId = new Map<number, number>();

  for (let cls = 0; cls < classCount; cls++) {
    const repIndex = equivalenceClass.indexOf(cls);
    const repState = reachableStates[repIndex];
    const newId = newStates.length;
    classToNewId.set(cls, newId);

    newStates.push({
      id: newId,
      nfaStates: classToNfaStates.get(cls)!,
      isAccepting: repState.isAccepting,
    });
  }

  const newTransitions: Transition[] = [];
  for (const t of reachableTransitions) {
    const fromCls = equivalenceClass[stateIdToIndex.get(t.from)!];
    const toCls = equivalenceClass[stateIdToIndex.get(t.to)!];
    const newFrom = classToNewId.get(fromCls)!;
    const newTo = classToNewId.get(toCls)!;

    // Avoid duplicate transitions
    const exists = newTransitions.some(
      nt => nt.from === newFrom && nt.to === newTo && nt.symbol === t.symbol
    );
    if (!exists) {
      newTransitions.push({ from: newFrom, to: newTo, symbol: t.symbol });
    }
  }

  const newStartState = classToNewId.get(equivalenceClass[stateIdToIndex.get(dfa.startState)!])!;
  const newAcceptStates = newStates.filter(s => s.isAccepting).map(s => s.id);

  return {
    states: newStates,
    alphabet: [...dfa.alphabet],
    startState: newStartState,
    acceptStates: newAcceptStates,
    transitions: newTransitions,
  };
}

function findReachableStates(dfa: DFA): Set<number> {
  const reachable = new Set<number>();
  const queue = [dfa.startState];
  reachable.add(dfa.startState);

  const transMap = new Map<number, Map<string, number>>();
  for (const t of dfa.transitions) {
    if (!transMap.has(t.from)) {
      transMap.set(t.from, new Map());
    }
    // DFA transitions never have null symbols
    transMap.get(t.from)!.set(t.symbol as string, t.to);
  }

  while (queue.length > 0) {
    const state = queue.shift()!;
    const transitions = transMap.get(state);
    if (transitions) {
      for (const to of transitions.values()) {
        if (!reachable.has(to)) {
          reachable.add(to);
          queue.push(to);
        }
      }
    }
  }

  return reachable;
}
