/**
 * Transition table for the ε-NFA.
 *
 * OWNER: Person 3.
 *
 * Differs from the DFA table in two ways:
 *   - an ε column, placed last
 *   - a cell holds a SET of states, e.g. `{q1, q3}` (an NFA is not deterministic)
 *
 * The ε column header is the glyph `ε` — the data is still `null`
 * (EPSILON CONTRACT).
 */

import { EPSILON, EPSILON_DISPLAY, type NFA } from '../compiler';
import { formatStateId } from '../hooks/useCompiler';

interface NfaTableProps {
  nfa: NFA;
  caption?: string;
}

function formatStateSet(states: number[]): string {
  if (states.length === 0) return '—';
  return '{' + states.map(formatStateId).join(', ') + '}';
}

export function NfaTable({ nfa, caption = 'ε-NFA transition table' }: NfaTableProps) {
  // Build transition lookup: from -> symbol -> set of target states
  const transMap = new Map<number, Map<string | null, number[]>>();
  for (const t of nfa.transitions) {
    if (!transMap.has(t.from)) {
      transMap.set(t.from, new Map());
    }
    const symbolMap = transMap.get(t.from)!;
    if (!symbolMap.has(t.symbol)) {
      symbolMap.set(t.symbol, []);
    }
    symbolMap.get(t.symbol)!.push(t.to);
  }

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
      <tbody>
        {nfa.states.map((stateId) => {
          const symbolMap = transMap.get(stateId);
          return (
            <tr key={stateId}>
              <th scope="row">
                {formatStateId(stateId)}
                {nfa.acceptStates.includes(stateId) && <span className="state-badge">accepting</span>}
              </th>
              {nfa.alphabet.map((symbol) => (
                <td key={symbol}>
                  {symbolMap?.has(symbol)
                    ? formatStateSet(symbolMap.get(symbol)!.sort((a, b) => a - b))
                    : <span className="empty-cell">—</span>}
                </td>
              ))}
              <td>
                {symbolMap?.has(EPSILON)
                  ? formatStateSet(symbolMap.get(EPSILON)!.sort((a, b) => a - b))
                  : <span className="empty-cell">—</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
