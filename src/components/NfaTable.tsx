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

import { EPSILON_DISPLAY, type NFA } from '../compiler';
import { formatStateId } from '../hooks/useCompiler';

interface NfaTableProps {
  nfa: NFA;
  caption?: string;
}

function formatStateSet(stateIds: readonly number[]): string {
  if (stateIds.length === 0) {
    return '';
  }
  return `{${stateIds.map(formatStateId).join(', ')}}`;
}

export function NfaTable({ nfa, caption = 'ε-NFA transition table' }: NfaTableProps) {
  const transitionsByCell = new Map<string, number[]>();
  for (const transition of nfa.transitions) {
    const key = `${transition.from}:${transition.symbol ?? EPSILON_DISPLAY}`;
    const existing = transitionsByCell.get(key);
    if (existing === undefined) {
      transitionsByCell.set(key, [transition.to]);
    } else if (!existing.includes(transition.to)) {
      existing.push(transition.to);
    }
  }

  function cellTargets(from: number, symbol: string | null): number[] {
    return transitionsByCell.get(`${from}:${symbol ?? EPSILON_DISPLAY}`) ?? [];
  }

  function renderCell(targets: readonly number[]): string | JSX.Element {
    const text = formatStateSet(targets);
    return text === '' ? <span className="empty-cell">—</span> : text;
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
        {nfa.states.map((state) => (
          <tr key={state}>
            <th scope="row">
              {formatStateId(state)}
              {state === nfa.startState && <span className="state-badge">start</span>}
              {nfa.acceptStates.includes(state) && <span className="state-badge">accept</span>}
            </th>
            {nfa.alphabet.map((symbol) => (
              <td key={symbol}>{renderCell(cellTargets(state, symbol))}</td>
            ))}
            <td>{renderCell(cellTargets(state, null))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
