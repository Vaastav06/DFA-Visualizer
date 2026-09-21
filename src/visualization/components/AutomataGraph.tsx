/**
 * The shared graph shell used by `<NfaGraph />` and `<DfaGraph />`.
 *
 * OWNER: Person 2.
 * Mounts `<ReactFlow />` with custom node and edge types, deterministic
 * layout from `layout/graphLayout.ts`, legend, and controls.
 *
 * Keeping the React Flow instance in ONE component means the NFA and DFA graphs
 * cannot drift apart visually.
 */

import { type ReactNode, useCallback, useMemo } from 'react';
import { Background, MarkerType, ReactFlow, ReactFlowProvider, type Node } from '@xyflow/react';

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
  height?: number | string;
  className?: string;
  onStateClick?: (stateId: number, data: StateNodeData) => void;
  selectedStateId?: number | null;
  children?: ReactNode;
}

function AutomataGraphInner({
  kind,
  graph,
  highlight,
  height,
  className,
  onStateClick,
  selectedStateId,
  children,
}: AutomataGraphProps) {
  const hasContent = graph !== null && graph.nodes.length > 0;

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
      const pos = layout.get(node.data.stateId) ?? { x: 0, y: 0 };
      const isHighlighted = Boolean(highlight?.states?.includes(node.data.stateId));
      const isSelected =
        selectedStateId !== undefined && selectedStateId !== null
          ? selectedStateId === node.data.stateId
          : Boolean(node.data.isSelected);

      return {
        id: node.id,
        type: 'state',
        position: pos,
        data: {
          ...node.data,
          isHighlighted,
          isSelected,
        },
      };
    });
  }, [graph, hasContent, layout, highlight?.states, selectedStateId]);

  // 3. Prepare React Flow edges with highlighting and markers
  const flowEdges: TransitionEdgeType[] = useMemo(() => {
    if (!hasContent) {
      return [];
    }
    return graph.edges.map((edge) => {
      const from = Number(edge.source);
      const to = Number(edge.target);

      const isHighlighted = Boolean(
        highlight?.transitions?.some(
          (ht) =>
            ht.from === from &&
            ht.to === to &&
            (ht.symbol === undefined || edge.data.symbols.includes(ht.symbol))
        )
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
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: markerColor,
          width: 14,
          height: 14,
        },
      };
    });
  }, [graph, hasContent, highlight?.transitions]);

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
