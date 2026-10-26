/**
 * Side-by-side comparison view between Direct DFA and Minimized DFA.
 *
 * OWNER: Person 3 / Visualization Enhancements.
 *
 * Shows partition refinement results, state reduction metrics,
 * correlated highlighting between minimized and direct DFA states,
 * and an equivalence mapping table.
 */

import { useMemo } from 'react';
import type { DFA } from '../compiler';
import { formatStateId } from '../hooks/useCompiler';
import { DfaGraph } from '../visualization';
import { mapDirectToMinimized } from './dfaEquivalence';

interface DfaComparisonProps {
  directDfa: DFA;
  minimizedDfa: DFA;
  selectedMinStateId: number | null;
  onSelectMinState: (id: number | null) => void;
  selectedDirectStateId: number | null;
  onSelectDirectState: (id: number | null) => void;
  showDeadState?: boolean;
}

export function DfaComparison({
  directDfa,
  minimizedDfa,
  selectedMinStateId,
  onSelectMinState,
  selectedDirectStateId,
  onSelectDirectState,
  showDeadState = false,
}: DfaComparisonProps) {
  const directStateCount = directDfa.states.length;
  const minStateCount = minimizedDfa.states.length;
  const directTransCount = directDfa.transitions.length;
  const minTransCount = minimizedDfa.transitions.length;
  const statesReduced = Math.max(0, directStateCount - minStateCount);

  // Compute equivalence partitions: which direct DFA states map to which minimized DFA state
  const equivalencePartitions = useMemo(() => {
    const minStateOf = mapDirectToMinimized(directDfa, minimizedDfa);
    return minimizedDfa.states.map((minState) => ({
      minId: minState.id,
      isAccepting: minState.isAccepting,
      positions: minState.positions,
      directMemberIds: directDfa.states
        .filter((directState) => minStateOf.get(directState.id) === minState.id)
        .map((s) => s.id),
    }));
  }, [directDfa, minimizedDfa]);

  // Which direct states correspond to the currently selected minimized state
  const correlatedDirectStateIds = useMemo(() => {
    if (selectedMinStateId === null) return undefined;
    const partition = equivalencePartitions.find((p) => p.minId === selectedMinStateId);
    return partition ? partition.directMemberIds : undefined;
  }, [equivalencePartitions, selectedMinStateId]);

  return (
    <div className="dfa-comparison" aria-label="DFA Minimization Comparison">
      {/* Metric summary banner */}
      <div className="dfa-comparison__metrics" role="region" aria-label="Minimization summary">
        <div className="dfa-comparison__metric-card">
          <span className="dfa-comparison__metric-title">Direct DFA</span>
          <span className="dfa-comparison__metric-value">{directStateCount} states</span>
          <span className="dfa-comparison__metric-sub">{directTransCount} transitions</span>
        </div>
        <div className="dfa-comparison__metric-card dfa-comparison__metric-card--arrow">
          <span className="dfa-comparison__arrow-glyph" aria-hidden="true">
            →
          </span>
          <span className="dfa-comparison__metric-badge">
            {statesReduced > 0 ? `${statesReduced} states merged` : 'Already minimal'}
          </span>
        </div>
        <div className="dfa-comparison__metric-card dfa-comparison__metric-card--accent">
          <span className="dfa-comparison__metric-title">Minimized DFA</span>
          <span className="dfa-comparison__metric-value">{minStateCount} states</span>
          <span className="dfa-comparison__metric-sub">{minTransCount} transitions</span>
        </div>
      </div>

      {/* Side-by-side graphs */}
      <div className="dfa-comparison__graphs">
        <div className="dfa-comparison__graph-panel">
          <h4 className="dfa-comparison__panel-heading">Direct DFA (Constructed)</h4>
          <DfaGraph
            dfa={directDfa}
            kind="dfa"
            selectedStateId={selectedDirectStateId}
            highlightedStateIds={correlatedDirectStateIds}
            showDeadState={showDeadState}
            onStateClick={(id) => onSelectDirectState(id === selectedDirectStateId ? null : id)}
            height={340}
          />
        </div>
        <div className="dfa-comparison__graph-panel">
          <h4 className="dfa-comparison__panel-heading">Minimized DFA (Moore Refined)</h4>
          <DfaGraph
            dfa={minimizedDfa}
            kind="minimized-dfa"
            selectedStateId={selectedMinStateId}
            showDeadState={showDeadState}
            onStateClick={(id) => onSelectMinState(id === selectedMinStateId ? null : id)}
            height={340}
          />
        </div>
      </div>

      {/* Equivalence Mapping Table */}
      <div className="dfa-comparison__table-wrap">
        <table className="dfa-comparison__table" aria-label="State Equivalence Mapping">
          <caption>State Equivalence & Partition Mapping</caption>
          <thead>
            <tr>
              <th scope="col">Minimized State</th>
              <th scope="col">Merged Direct States</th>
              <th scope="col">Position Set</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {equivalencePartitions.map((part) => {
              const isSelected = selectedMinStateId === part.minId;
              const directLabels =
                part.directMemberIds.length > 0
                  ? part.directMemberIds.map((id) => formatStateId(id)).join(', ')
                  : '—';
              const posStr = part.positions.length > 0 ? `{${part.positions.join(', ')}}` : '∅';

              return (
                <tr
                  key={part.minId}
                  className={isSelected ? 'dfa-comparison__row--selected' : undefined}
                  onClick={() => onSelectMinState(isSelected ? null : part.minId)}
                  style={{ cursor: 'pointer' }}
                >
                  <th scope="row">{formatStateId(part.minId)}</th>
                  <td>
                    <code>{directLabels}</code>
                  </td>
                  <td>
                    <code>{posStr}</code>
                  </td>
                  <td>{part.isAccepting ? 'accepting' : 'non-accepting'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
