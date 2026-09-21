/**
 * Generic transition table: rows are states, columns are alphabet symbols.
 *
 * OWNER: Person 3.
 * TODO(Person 3): implement the body from the DFA's transitions.
 *
 * Display rules:
 *   state ids render as `q0`, `q1`, ...    (STATE ID CONTRACT)
 *   a missing transition renders as an em dash, not "null" or "undefined"
 */

import type { DFA } from '../compiler';

interface TransitionTableProps {
  dfa: DFA;
  /** Optional caption, e.g. "Minimized DFA transition table". */
  caption?: string;
}

export function TransitionTable({ dfa, caption = 'DFA transition table' }: TransitionTableProps) {
  return (
    <table className="transition-table">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">State</th>
          {dfa.alphabet.map((symbol) => (
            <th scope="col" key={symbol}>
              {symbol}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{/* TODO(Person 3): one row per dfa.states entry. */}</tbody>
    </table>
  );
}
