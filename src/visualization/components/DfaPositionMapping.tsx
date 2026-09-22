/**
 * Table mapping DFA states to their canonical syntax-tree position subsets.
 *
 * OWNER: Person 2.
 * Crucial for explaining the direct followpos DFA construction algorithm:
 * shows which leaf positions form each deterministic state.
 */

import type { DFA } from '../../compiler/types';

interface DfaPositionMappingProps {
  dfa: DFA | null | undefined;
  selectedStateId?: number | null;
  onSelectState?: (stateId: number) => void;
  className?: string;
}

export function DfaPositionMapping({
  dfa,
  selectedStateId,
  onSelectState,
  className,
}: DfaPositionMappingProps) {
  if (!dfa || !dfa.states || dfa.states.length === 0) {
    return (
      <div className="vis-empty-state" role="status">
        <p>No DFA states available.</p>
      </div>
    );
  }

  const acceptSet = new Set(dfa.acceptStates ?? []);

  return (
    <div className={['vis-table-container', className].filter(Boolean).join(' ')}>
      <table className="vis-table dfa-mapping-table" aria-label="DFA State to Position Mapping">
        <caption className="vis-table__caption">
          Each DFA state corresponds to a unique subset of syntax-tree leaf positions
        </caption>
        <thead>
          <tr>
            <th scope="col">DFA State</th>
            <th scope="col">Syntax-tree Positions</th>
            <th scope="col">Accepting?</th>
          </tr>
        </thead>
        <tbody>
          {dfa.states.map((state) => {
            const isSelected = selectedStateId === state.id;
            const isStart = state.id === dfa.startState;
            const isAccepting = state.isAccepting || acceptSet.has(state.id);
            const positions = state.positions ?? state.nfaStates ?? [];
            const posString = positions.length > 0 ? `{${positions.join(', ')}}` : '∅';

            return (
              <tr
                key={state.id}
                className={[
                  isSelected ? 'vis-table__row--selected' : '',
                  onSelectState ? 'vis-table__row--clickable' : '',
                  isAccepting ? 'dfa-mapping-table__row--accepting' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectState?.(state.id)}
                tabIndex={onSelectState ? 0 : undefined}
                role={onSelectState ? 'button' : undefined}
              >
                <td>
                  <span className="vis-state-badge">
                    <code>q{state.id}</code>
                    {isStart && <span className="vis-tag vis-tag--start">start</span>}
                  </span>
                </td>
                <td className="vis-table__set-cell">
                  <code>{posString}</code>
                </td>
                <td>
                  {isAccepting ? (
                    <span className="vis-badge vis-badge--success">Accepting (contains #)</span>
                  ) : (
                    <span className="vis-badge vis-badge--muted">No</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

