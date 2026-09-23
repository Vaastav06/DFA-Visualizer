/**
 * The shared graph shell used by `<DfaGraph />`.
 *
 * OWNER: Person 2.
 * Mounts `<ReactFlow />` with custom node and edge types, deterministic
 * layout from `layout/graphLayout.ts`, legend, and controls.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Background,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type Node,
  type OnNodesChange,
  type XYPosition,
} from '@xyflow/react';

import type { AutomatonKind, GraphHighlight, StateNodeData } from '../types';
import type { AdaptedGraph } from '../adapters/nfaAdapter';
import { layoutAutomaton } from '../layout/graphLayout';
import { StateNode, type StateNodeType } from './StateNode';
import { TransitionEdge, type TransitionEdgeType } from './TransitionEdge';
import { EmptyGraphState } from './EmptyGraphState';
import { GraphControls } from './GraphControls';
import { GraphLegend } from './GraphLegend';

import '@xyflow/react/dist/style.css';
import '../AutomataGraph.css';

// Polyfill ResizeObserver in test environments (e.g. jsdom) if missing
if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const nodeTypes = {
  state: StateNode,
};

const edgeTypes = {
  transition: TransitionEdge,
};

interface AutomataGraphProps {
  kind: AutomatonKind;
  graph: AdaptedGraph | null;
  highlight?: GraphHighlight;
  activeStateId?: number | null;
  highlightedStateIds?: number[];
  highlightedTransition?: { from: number; to: number; symbol?: string | null } | null;
  height?: number | string;
  className?: string;
  onStateClick?: (stateId: number, data: StateNodeData) => void;
  selectedStateId?: number | null;
  children?: ReactNode;
}

/**
 * Pixel separation between adjacent parallel/bidirectional edges.
 * Applied as a vertical control-point bow in `TransitionEdge`.
 */
const PARALLEL_SPREAD_PX = 44;

/** Key grouping edges that share the same undirected state pair. */
function unorderedPairKey(from: number, to: number): string {
  return from <= to ? `${from}-${to}` : `${to}-${from}`;
}

/** Per-node overrides kept across controlled ReactFlow updates. */
interface NodeOverride {
  position?: XYPosition;
  selected?: boolean;
}

function AutomataGraphInner({
  kind,
  graph,
  highlight,
  activeStateId,
  highlightedStateIds,
  highlightedTransition,
  height,
  className,
  onStateClick,
  selectedStateId,
  children,
}: AutomataGraphProps) {
  const hasContent = graph !== null && graph.nodes.length > 0;

  // Drag/select overrides: controlled ReactFlow drops these changes unless we
  // persist them here and feed them back via the `nodes` prop.
  const [nodeOverrides, setNodeOverrides] = useState<Record<string, NodeOverride>>({});
  const graphKey = layoutKey(graph);

  // New layout/graph → drop manual positions so the deterministic layout applies.
  useEffect(() => {
    setNodeOverrides({});
  }, [graphKey]);

  // 1. Calculate deterministic layout
  const layout = useMemo(() => {
    if (!hasContent) {
      return new Map();
    }
    const states = graph.nodes.map((n) => n.data.stateId);
    const startState =
      graph.nodes.find((n) => n.data.isStart)?.data.stateId ?? (states.length > 0 ? states[0] : 0);
    const transitions = graph.edges.map((e) => ({
      from: Number(e.source),
      to: Number(e.target),
      symbol: e.data.symbols[0],
    }));

    return layoutAutomaton(states, transitions, startState);
  }, [graph, hasContent]);

  // 2. Prepare React Flow nodes with layout positions and visual states
  const flowNodes: StateNodeType[] = useMemo(() => {
    if (!hasContent) {
      return [];
    }
    return graph.nodes.map((node) => {
      const override = nodeOverrides[node.id];
      const pos = override?.position ?? layout.get(node.data.stateId) ?? { x: 0, y: 0 };
      const isHighlighted =
        Boolean(highlight?.states?.includes(node.data.stateId)) ||
        Boolean(highlightedStateIds?.includes(node.data.stateId));
      const isActive =
        activeStateId !== undefined &&
        activeStateId !== null &&
        activeStateId === node.data.stateId;
      const isSelected =
        selectedStateId !== undefined && selectedStateId !== null
          ? selectedStateId === node.data.stateId
          : Boolean(node.data.isSelected);

      return {
        id: node.id,
        type: 'state',
        position: pos,
        selected: override?.selected,
        data: {
          ...node.data,
          isHighlighted,
          isActive,
          isSelected,
        },
      };
    });
  }, [
    graph,
    hasContent,
    layout,
    nodeOverrides,
    highlight?.states,
    highlightedStateIds,
    activeStateId,
    selectedStateId,
  ]);

  // 3. Prepare React Flow edges with highlighting, markers, and parallel offsets
  const flowEdges: TransitionEdgeType[] = useMemo(() => {
    if (!hasContent) {
      return [];
    }

    // Group by *undirected* pair so a→b and b→a also separate, not just
    // same-direction parallels (getBezierPath curvature is zero for both cases).
    const parallelCounts = new Map<string, number>();
    for (const edge of graph.edges) {
      const key = unorderedPairKey(Number(edge.source), Number(edge.target));
      parallelCounts.set(key, (parallelCounts.get(key) ?? 0) + 1);
    }
    const parallelSeen = new Map<string, number>();

    return graph.edges.map((edge) => {
      const from = Number(edge.source);
      const to = Number(edge.target);

      const pairKey = unorderedPairKey(from, to);
      const parallelCount = parallelCounts.get(pairKey) ?? 1;
      const parallelIndex = parallelSeen.get(pairKey) ?? 0;
      parallelSeen.set(pairKey, parallelIndex + 1);
      const parallelOffset =
        parallelCount <= 1
          ? 0
          : (parallelIndex - (parallelCount - 1) / 2) * PARALLEL_SPREAD_PX;

      const isHighlighted =
        Boolean(
          highlight?.transitions?.some(
            (ht) =>
              ht.from === from &&
              ht.to === to &&
              (ht.symbol === undefined || edge.data.symbols.includes(ht.symbol))
          )
        ) ||
        Boolean(
          highlightedTransition &&
          highlightedTransition.from === from &&
          highlightedTransition.to === to &&
          (highlightedTransition.symbol === undefined ||
            edge.data.symbols.includes(highlightedTransition.symbol))
        );

      const isSelfLoop = from === to;
      const isBackEdge = from > to;

      const sourceHandle = isSelfLoop ? 'top' : isBackEdge ? 'bottom' : 'right';
      const targetHandle = isSelfLoop ? 'top-target' : isBackEdge ? 'bottom-target' : 'left';

      const markerColor = isHighlighted
        ? 'var(--edge-highlight)'
        : edge.data.isEpsilon
          ? 'var(--edge-epsilon)'
          : 'var(--edge)';

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle,
        targetHandle,
        type: 'transition',
        data: {
          ...edge.data,
          isHighlighted,
          parallelIndex,
          parallelCount,
          parallelOffset,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: markerColor,
          width: 14,
          height: 14,
        },
      };
    });
  }, [graph, hasContent, highlight?.transitions, highlightedTransition]);

  // Handle node selection
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeData = node.data as StateNodeData;
      if (onStateClick && nodeData?.stateId !== undefined) {
        onStateClick(nodeData.stateId, nodeData);
      }
    },
    [onStateClick]
  );

  // Persist drag/selection changes so controlled `nodes` stay in sync.
  const handleNodesChange: OnNodesChange<StateNodeType> = useCallback((changes) => {
    setNodeOverrides((prev) => {
      let next: Record<string, NodeOverride> | null = null;
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          next ??= { ...prev };
          next[change.id] = { ...next[change.id], position: change.position };
        } else if (change.type === 'select') {
          next ??= { ...prev };
          next[change.id] = { ...next[change.id], selected: change.selected };
        } else if (change.type === 'remove') {
          next ??= { ...prev };
          delete next[change.id];
        }
      }
      return next ?? prev;
    });
  }, []);

  return (
    <figure
      className={['automata-graph', className].filter(Boolean).join(' ')}
      style={height === undefined ? undefined : { height }}
      aria-label={`${kind.toUpperCase()} state transition graph`}
    >
      <div className="automata-graph__canvas">
        {hasContent ? (
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={handleNodesChange}
            onNodeClick={handleNodeClick}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={2.5}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            zoomOnScroll={true}
            panOnDrag={true}
            proOptions={{ hideAttribution: true }}
            aria-label={`${kind.toUpperCase()} state diagram`}
          >
            <Background gap={20} size={1} color="var(--border)" />
          </ReactFlow>
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

export function AutomataGraph(props: AutomataGraphProps) {
  return (
    <ReactFlowProvider>
      <AutomataGraphInner {...props} />
    </ReactFlowProvider>
  );
}

/** Stable key for the current graph identity (used to reset drag overrides). */
function layoutKey(graph: AdaptedGraph | null): string {
  if (!graph) return '';
  return graph.nodes.map((n) => n.id).join(',') + '|' + graph.edges.map((e) => e.id).join(',');
}
