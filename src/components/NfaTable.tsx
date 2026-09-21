/**
 * Transition table for the ε-NFA.
 *
 * OWNER: Person 3.
 * TODO(Person 3): implement the body.
 *
 * Differs from the DFA table in two ways:
 *   - an ε column, placed last
 *   - a cell holds a SET of states, e.g. `{q1, q3}` (an NFA is not deterministic)
 *
 * The ε column header is the glyph `ε` — the data is still `null`
 * (EPSILON CONTRACT).
 */

import { EPSILON_DISPLAY, type NFA } from '../compiler';

interface NfaTableProps {
  nfa: NFA;
  caption?: string;
}

export function NfaTable({ nfa, caption = 'ε-NFA transition table' }: NfaTableProps) {
  return (
    <table className="transition-table transition-table--nfa">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">State</th>
          {nfa.alphabet.map((symbol) => (
            <th scope="col" key={symbol}>
              {symbol}
            </th>
          ))}
          <th scope="col">{EPSILON_DISPLAY}</th>
        </tr>
      </thead>
      <tbody>{/* TODO(Person 3): one row per nfa.states entry. */}</tbody>
    </table>
  );
}
