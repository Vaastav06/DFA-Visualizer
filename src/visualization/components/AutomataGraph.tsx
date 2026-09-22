/**
 * The shared graph shell used by `<NfaGraph />` and `<DfaGraph />`.
 *
 * OWNER: Person 2.
 *
 * Mounts `<ReactFlow />` with custom node/edge types, the layout from
 * `layout/graphLayout.ts` and the controls. Keeping the React Flow instance
 * in ONE component means the NFA and DFA graphs cannot drift apart visually.
 */

import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
} from '@xyflow/react';
import type { AutomatonKind } from '../types';
import type { AdaptedGraph, GraphNode, GraphEdge } from '../adapters/nfaAdapter';
import { layoutAutomaton } from '../layout/graphLayout';
import { EmptyGraphState } from './EmptyGraphState';
import { GraphControls } from './GraphControls';
import { GraphLegend } from './GraphLegend';
import { StateNode } from './StateNode';
import { TransitionEdge } from './TransitionEdge';
import type { Transition } from '../../compiler/types';

// Import React Flow styles
import '@xyflow/react/dist/style.css';

interface AutomataGraphProps {
  kind: AutomatonKind;
  graph: AdaptedGraph | null;
  height?: number | string;
  className?: string;
  highlight?: { states?: number[]; transitions?: { from: number; to: number; symbol: string | null }[] };
}

const nodeTypes = {
  stateNode: StateNode,
};

const edgeTypes = {
  transitionEdge: TransitionEdge,
};

function adaptToReactFlowNodes(graphNodes: GraphNode[], positions: Map<number, { x: number; y: number }>): Node[] {
  return graphNodes.map(gn => ({
    id: gn.id,
    type: 'stateNode',
    position: positions.get(Number(gn.id)) || { x: 0, y: 0 },
    data: gn.data,
    draggable: true,
  }));
}

function adaptToReactFlowEdges(graphEdges: GraphEdge[]): Edge[] {
  return graphEdges.map(ge => ({
    id: ge.id,
    source: ge.source,
    target: ge.target,
    type: 'transitionEdge',
    data: ge.data,
    animated: false,
    markerEnd: {
      type: 'arrowclosed',
      color: '#374151',
      width: 16,
      height: 16,
    },
    style: {
      strokeWidth: 1.5,
    },
  }));
}

interface GraphEdgeData {
  symbols: (string | null)[];
  label: string;
  isEpsilon: boolean;
  isHighlighted?: boolean;
}

// Inner component that has access to ReactFlow instance via useReactFlow
function GraphCanvas({
  mergedNodes,
  mergedEdges,
  onConnect,
}: {
  mergedNodes: Node[];
  mergedEdges: Edge[];
  onConnect: () => void;
}) {
  const reactFlowInstance = useReactFlow();

  const handleZoomIn = useCallback(() => reactFlowInstance.zoomIn(), [reactFlowInstance]);
  const handleZoomOut = useCallback(() => reactFlowInstance.zoomOut(), [reactFlowInstance]);
  const handleFitView = useCallback(() => reactFlowInstance.fitView({ padding: 0.1, duration: 300 }), [reactFlowInstance]);
  const handleReset = useCallback(() => reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 }), [reactFlowInstance]);

  return (
    <>
      <ReactFlow
        nodes={mergedNodes}
        edges={mergedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
        panOnScroll={false}
        minZoom={0.3}
        maxZoom={3}
      />
      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onReset={handleReset}
      />
    </>
  );
}

export function AutomataGraph({ kind, graph, height, className, highlight }: AutomataGraphProps) {
  const nodes = useMemo(() => {
    if (!graph) return [];
    const positions = layoutAutomaton(
      graph.nodes.map(n => Number(n.id)),
      graph.edges.map(e => ({ from: Number(e.source), to: Number(e.target), symbol: e.data.symbols[0] } as Transition)),
      Number(graph.nodes.find(n => n.data.isStart)?.id || 0)
    );
    return adaptToReactFlowNodes(graph.nodes, positions);
  }, [graph]);

  const edges = useMemo(() => {
    if (!graph) return [];
    return adaptToReactFlowEdges(graph.edges);
  }, [graph]);

  // Apply highlight if provided
  const highlightedNodeIds = useMemo(() => new Set(highlight?.states || []), [highlight?.states]);
  const highlightedEdgeKeys = useMemo(() => {
    const set = new Set<string>();
    if (highlight?.transitions) {
      for (const t of highlight.transitions) {
        set.add(`${t.from}->${t.to}:${t.symbol}`);
      }
    }
    return set;
  }, [highlight?.transitions]);

  const mergedNodes = useMemo(() => {
    return nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        isHighlighted: highlightedNodeIds.has(Number(n.id)),
      },
    }));
  }, [nodes, highlightedNodeIds]);

  const mergedEdges = useMemo(() => {
    return edges.map(e => {
      const edgeData = e.data as unknown as GraphEdgeData;
      return {
        ...e,
        data: {
          ...edgeData,
          isHighlighted: highlightedEdgeKeys.has(`${e.source}->${e.target}:${edgeData.symbols[0] ?? null}`),
        },
      };
    });
  }, [edges, highlightedEdgeKeys]);

  const onConnect = useCallback(() => {
    // Graph is not editable - connections are for visualization only
    return;
  }, []);

  const hasContent = graph !== null && graph.nodes.length > 0;

  return (
    <ReactFlowProvider>
      <figure
        className={['automata-graph', className].filter(Boolean).join(' ')}
        style={height === undefined ? undefined : { height }}
      >
        <div className="automata-graph__canvas">
          {hasContent ? (
            <GraphCanvas
              mergedNodes={mergedNodes}
              mergedEdges={mergedEdges}
              onConnect={onConnect}
            />
          ) : (
            <EmptyGraphState />
          )}
        </div>
        <figcaption className="automata-graph__footer">
          <GraphLegend kind={kind} />
          {/* GraphControls are now rendered inside GraphCanvas */}
        </figcaption>
      </figure>
    </ReactFlowProvider>
  );
}
