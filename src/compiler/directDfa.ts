/**
 * Stage 6 - Direct Regular Expression to DFA Construction.
 *
 * CONTRACT: constructs the DFA directly from the syntax tree and followpos table.
 *
 * Algorithm:
 *  1. Initial DFA state D0 = firstpos(root)
 *  2. For each DFA state S and each symbol a in the alphabet:
 *       U = union of followpos(p) for all p ∈ S where symbol(p) == a
 *       if U is non-empty:
 *         if U is not already a DFA state, create it
 *         add transition S --a--> U
 *  3. A DFA state is accepting iff its positions set includes the position
 *     assigned to the end-marker `#`.
 *
 * Output invariants:
 *  - State IDs are 0..n-1 in discovery order; state 0 is the start state.
 *  - `positions` is the canonical, sorted, duplicate-free array of leaf positions.
 *  - Empty transition targets are NOT materialized (partial DFA policy D-006).
 *  - No epsilon transitions.
 */

import type { DFA, DFAState, FollowPosEntry, SyntaxNode, Transition } from './types';

/**
 * Creates a canonical string key for a position set.
 */
export function positionSetKey(positions: number[]): string {
  return positions.join(',');
}

/**
 * Constructs a DFA directly from an augmented syntax tree and its followpos table.
 *
 * @param root Root of the augmented syntax tree.
 * @param alphabet Alphabet symbols (excluding the end-marker `#`).
 * @param followpos Complete followpos table.
 * @param endMarkerPosition The 1-based position of the end-marker `#`.
 * @returns A deterministic finite automaton (DFA).
 */
export function constructDirectDFA(
  root: SyntaxNode,
  alphabet: string[],
  followpos: FollowPosEntry[],
  endMarkerPosition: number
): DFA {
  // Fast lookup: position -> { symbol, followpos }
  const posInfoMap = new Map<number, { symbol: string; followpos: number[] }>();
  for (const entry of followpos) {
    posInfoMap.set(entry.position, {
      symbol: entry.symbol,
      followpos: entry.followpos,
    });
  }

  // Deduplication map: canonicalKey -> stateId
  const idByKey = new Map<string, number>();
  const states: DFAState[] = [];
  const transitions: Transition[] = [];

  const intern = (positions: number[]): number => {
    const canonicalPositions = [...new Set(positions)].sort((a, b) => a - b);
    const key = positionSetKey(canonicalPositions);
    const existing = idByKey.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const id = states.length;
    idByKey.set(key, id);
    const isAccepting = canonicalPositions.includes(endMarkerPosition);

    states.push({
      id,
      positions: canonicalPositions,
      isAccepting,
    });

    return id;
  };

  // Start state D0 = firstpos(root)
  const startPositions = [...new Set(root.firstpos)].sort((a, b) => a - b);
  intern(startPositions);

  // Breadth-first worklist over discovered DFA states
  for (let i = 0; i < states.length; i += 1) {
    const currentState = states[i];

    for (const symbol of alphabet) {
      // Find all positions p in currentState where symbol(p) == symbol
      const targetPositionsSet = new Set<number>();

      for (const p of currentState.positions) {
        const info = posInfoMap.get(p);
        if (info && info.symbol === symbol) {
          for (const targetPos of info.followpos) {
            targetPositionsSet.add(targetPos);
          }
        }
      }

      // If target set is empty, do not materialize a dead state (Decision D-006)
      if (targetPositionsSet.size === 0) {
        continue;
      }

      const targetPositions = [...targetPositionsSet].sort((a, b) => a - b);
      const targetId = intern(targetPositions);

      transitions.push({
        from: currentState.id,
        to: targetId,
        symbol,
      });
    }
  }

  return {
    states,
    alphabet: [...alphabet].sort(),
    startState: 0,
    acceptStates: states.filter((s) => s.isAccepting).map((s) => s.id),
    transitions,
  };
}
