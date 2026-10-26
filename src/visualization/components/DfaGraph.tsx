/**
 * PUBLIC COMPONENT — renders a DFA (or a minimized DFA).
 *
 * OWNER: Person 2. Consumed by Person 3 as:
 *   <DfaGraph dfa={result.dfa} />
 *   <DfaGraph dfa={result.minimizedDfa} kind="minimized-dfa" />
 *
 * A `null`/`undefined` automaton must render the empty state, never crash.
 */

import { useMemo } from 'react';
import type { DfaGraphProps } from '../types';
import { adaptDfa } from '../adapters/dfaAdapter';
import { AutomataGraph } from './AutomataGraph';

export function DfaGraph({
  dfa,
  kind = 'dfa',
  showDeadState = false,
  highlight,
  activeStateId,
  highlightedStateIds,
  highlightedTransition,
  height,
  className,
  onStateClick,
  selectedStateId,
}: DfaGraphProps) {
  const graph = useMemo(
    () => (dfa ? adaptDfa(dfa, { includeDeadState: showDeadState }) : null),
    [dfa, showDeadState]
  );

  return (
    <AutomataGraph
      kind={kind}
      graph={graph}
      highlight={highlight}
      activeStateId={activeStateId}
      highlightedStateIds={highlightedStateIds}
      highlightedTransition={highlightedTransition}
      height={height}
      className={className}
      onStateClick={onStateClick}
      selectedStateId={selectedStateId}
    />
  );
}
