/**
 * The shared graph shell used by `<NfaGraph />` and `<DfaGraph />`.
 *
 * OWNER: Person 2.
 * TODO(Person 2): mount `<ReactFlow />` here with the custom node/edge types,
 * the layout from `layout/graphLayout.ts` and the controls.
 *
 * Keeping the React Flow instance in ONE component means the NFA and DFA graphs
 * cannot drift apart visually.
 */

import type { ReactNode } from 'react';
import type { AutomatonKind } from '../types';
import type { AdaptedGraph } from '../adapters/nfaAdapter';
import { EmptyGraphState } from './EmptyGraphState';
import { GraphControls } from './GraphControls';
import { GraphLegend } from './GraphLegend';

interface AutomataGraphProps {
  kind: AutomatonKind;
  graph: AdaptedGraph | null;
  height?: number | string;
  className?: string;
  children?: ReactNode;
}

export function AutomataGraph({ kind, graph, height, className, children }: AutomataGraphProps) {
  const hasContent = graph !== null && graph.nodes.length > 0;

  return (
    <figure
      className={['automata-graph', className].filter(Boolean).join(' ')}
      style={height === undefined ? undefined : { height }}
    >
      <div className="automata-graph__canvas">
        {hasContent ? (
          <p className="automata-graph__placeholder">
            {/* TODO(Person 2): replace with the React Flow canvas. */}
            Graph rendering is not implemented yet ({graph.nodes.length} states,{' '}
            {graph.edges.length} transitions).
          </p>
        ) : (
          <EmptyGraphState />
        )}
        {children}
      </div>
      <figcaption className="automata-graph__footer">
        <GraphLegend kind={kind} />
        <GraphControls />
      </figcaption>
    </figure>
  );
}
