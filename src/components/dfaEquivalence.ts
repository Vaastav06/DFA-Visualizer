import type { DFA } from '../compiler';

/**
 * Maps each direct DFA state to the minimized state it was merged into.
 *
 * Both DFAs accept the same language, so reading the same string from both
 * start states always lands in a direct state and its merged counterpart.
 * Walking the two automata in lockstep therefore gives the exact mapping.
 * Comparing position sets does not: sets of different states overlap.
 */
export function mapDirectToMinimized(directDfa: DFA, minimizedDfa: DFA): Map<number, number> {
  const targetOf = (dfa: DFA, from: number, symbol: string) =>
    dfa.transitions.find((t) => t.from === from && t.symbol === symbol)?.to;

  const minStateOf = new Map<number, number>([[directDfa.startState, minimizedDfa.startState]]);
  const queue = [directDfa.startState];

  for (let i = 0; i < queue.length; i += 1) {
    const directState = queue[i];
    const minState = minStateOf.get(directState) as number;
    for (const symbol of directDfa.alphabet) {
      const directTarget = targetOf(directDfa, directState, symbol);
      const minTarget = targetOf(minimizedDfa, minState, symbol);
      if (directTarget === undefined || minTarget === undefined) continue;
      if (!minStateOf.has(directTarget)) {
        minStateOf.set(directTarget, minTarget);
        queue.push(directTarget);
      }
    }
  }

  return minStateOf;
}
