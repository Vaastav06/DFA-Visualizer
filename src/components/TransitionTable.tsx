/**
 * Generic transition table: rows are states, columns are alphabet symbols.
 *
 * OWNER: Person 3.
 *
 * Display rules:
 *   state ids render as `q0`, `q1`, ...    (STATE ID CONTRACT)
 *   a missing transition renders as an em dash, not "null" or "undefined"
 */

import type { DFA } from '../compiler';
import { formatStateId } from '../hooks/useCompiler';

interface TransitionTableProps {
  dfa: DFA;
  /** Optional caption, e.g. "Minimized DFA transition table". */
  caption?: string;
}

export function TransitionTable({ dfa, caption = 'DFA transition table' }: TransitionTableProps) {
  // Build transition lookup for quick access
  const transMap = new Map<string, string>();
  for (const t of dfa.transitions) {
    transMap.set(`${t.from}:${t.symbol}`, String(t.to));
  }

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
      <tbody>
        {dfa.states.map((state) => (
          <tr key={state.id}>
            <th scope="row">
              {formatStateId(state.id)}
              {state.isAccepting && <span className="state-badge">accepting</span>}
            </th>
            {dfa.alphabet.map((symbol) => {
              const target = transMap.get(`${state.id}:${symbol}`);
              return (
                <td key={symbol}>
                  {target ? formatStateId(Number(target)) : <span className="empty-cell">—</span>}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
