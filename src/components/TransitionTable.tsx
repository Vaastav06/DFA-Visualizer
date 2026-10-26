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
import { DEAD_STATE_ID, formatStateId } from '../hooks/useCompiler';

interface TransitionTableProps {
  dfa: DFA;
  /** Optional caption, e.g. "Minimized DFA transition table". */
  caption?: string;
  selectedStateId?: number | null;
  onSelectState?: (stateId: number) => void;
  showDeadState?: boolean;
}

export function TransitionTable({
  dfa,
  caption = 'DFA transition table',
  selectedStateId,
  onSelectState,
  showDeadState = false,
}: TransitionTableProps) {
  const acceptSet = new Set(dfa.acceptStates);

  function targetFor(from: number, symbol: string): number | undefined {
    return dfa.transitions.find((t) => t.from === from && t.symbol === symbol)?.to;
  }

  const hasMissingTransitions = dfa.states.some((state) =>
    dfa.alphabet.some((symbol) => targetFor(state.id, symbol) === undefined)
  );

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
        {dfa.states.map((state) => {
          const isSelected = selectedStateId === state.id;
          return (
            <tr
              key={state.id}
              className={isSelected ? 'transition-table__row--selected' : undefined}
              onClick={() => onSelectState?.(state.id)}
              style={onSelectState ? { cursor: 'pointer' } : undefined}
            >
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
                      showDeadState ? (
                        <span className="dead-state-target">{formatStateId(DEAD_STATE_ID)}</span>
                      ) : (
                        <span className="empty-cell">—</span>
                      )
                    ) : (
                      formatStateId(target)
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}
        {showDeadState && hasMissingTransitions && (
          <tr
            key={DEAD_STATE_ID}
            className={
              selectedStateId === DEAD_STATE_ID ? 'transition-table__row--selected' : undefined
            }
            onClick={() => onSelectState?.(DEAD_STATE_ID)}
            style={onSelectState ? { cursor: 'pointer' } : undefined}
          >
            <th scope="row">
              {formatStateId(DEAD_STATE_ID)}
              <span className="state-badge state-badge--dead">trap</span>
            </th>
            {dfa.alphabet.map((symbol) => (
              <td key={symbol}>
                <span className="dead-state-target">{formatStateId(DEAD_STATE_ID)}</span>
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  );
}
