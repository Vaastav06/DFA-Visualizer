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
  const acceptSet = new Set(dfa.acceptStates);

  function targetFor(from: number, symbol: string): number | undefined {
    return dfa.transitions.find((t) => t.from === from && t.symbol === symbol)?.to;
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
              {state.id === dfa.startState && <span className="state-badge">start</span>}
              {(state.isAccepting || acceptSet.has(state.id)) && (
                <span className="state-badge">accept</span>
              )}
            </th>
            {dfa.alphabet.map((symbol) => {
              const target = targetFor(state.id, symbol);
              return (
                <td key={symbol}>
                  {target === undefined ? (
                    <span className="empty-cell">—</span>
                  ) : (
                    formatStateId(target)
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
