/**
 * The shared graph shell used by `<DfaGraph />`.
 *
 * OWNER: Person 2.
 * Mounts `<ReactFlow />` with custom node and edge types, deterministic
 * layout from `layout/graphLayout.ts`, edge routing from
 * `layout/edgeRouting.ts`, legend, and controls.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Background,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore,
  type Node,
  type OnNodesChange,
  type XYPosition,
} from '@xyflow/react';

import type { AutomatonKind, GraphHighlight, StateNodeData } from '../types';
import type { AdaptedGraph } from '../adapters/nfaAdapter';
import { layoutAutomaton } from '../layout/graphLayout';
import { buildFlowEdges, routeGraph } from '../adapters/flowEdges';
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

/** Fraction of the content box kept as margin when fitting the view. */
const FIT_PADDING = 0.12;
/** Smallest frame we fit to, so a one- or two-state DFA isn't blown up to max zoom. */
const MIN_FIT_WIDTH = 420;
const MIN_FIT_HEIGHT = 240;

/** Per-node overrides kept across controlled ReactFlow updates. */
interface NodeOverride {
  position?: XYPosition;
  selected?: boolean;
  /** Measured size; React Flow needs it echoed back to treat a node as initialized. */
  measured?: { width: number; height: number };
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
  const [showMiniMap, setShowMiniMap] = useState(false);
  const handleToggleMiniMap = useCallback(() => setShowMiniMap((v) => !v), []);
  const graphKey = layoutKey(graph);

  // New layout/graph → drop manual positions so the deterministic layout applies.
  // Measured sizes are kept: React Flow does not re-report an unchanged size.
  useEffect(() => {
    setNodeOverrides((prev) => {
      const kept: Record<string, NodeOverride> = {};
      for (const [id, o] of Object.entries(prev)) {
        if (o.measured) kept[id] = { measured: o.measured };
      }
      return kept;
    });
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
        measured: override?.measured,
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

  // 3. Route every edge at once from the current node centres. Depends only on
  //    geometry (not on highlight/selection), so simulation steps never re-route.
  const routing = useMemo(() => {
    if (!hasContent) {
      return null;
    }
    return routeGraph(
      graph,
      (id, stateId) => nodeOverrides[id]?.position ?? layout.get(stateId) ?? { x: 0, y: 0 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on positions, not selection
  }, [graph, hasContent, layout, positionKey(nodeOverrides)]);

  // 4. Prepare React Flow edges with highlighting, markers, and routed geometry
  const flowEdges: TransitionEdgeType[] = useMemo(
    () => (hasContent ? buildFlowEdges(graph, routing, highlight, highlightedTransition) : []),
    [graph, hasContent, routing, highlight, highlightedTransition]
  );

  // 5. Fit to the routed content (states + loops + arcs + labels). React Flow's
  //    own fitView only sees node boxes and clips self-loops and outer arcs.
  const { fitBounds, setViewport } = useReactFlow();
  const viewportWidth = useStore((s) => s.width);
  const viewportHeight = useStore((s) => s.height);
  // fitBounds is a no-op until React Flow's pan/zoom exists; `onInit` marks that.
  // (useNodesInitialized can't be used: this controlled graph ignores
  // dimension changes, and the routed bounds don't need DOM measurement.)
  const [flowReady, setFlowReady] = useState(false);
  const handleInit = useCallback(() => setFlowReady(true), []);
  useEffect(() => {
    if (!hasContent) setFlowReady(false);
  }, [hasContent]);
  const boundsRef = useRef(routing?.bounds);
  useEffect(() => {
    boundsRef.current = routing?.bounds;
  }, [routing]);

  const fitContent = useCallback(
    (duration = 0) => {
      const bounds = boundsRef.current;
      if (bounds && (bounds.width > 0 || bounds.height > 0)) {
        const width = Math.max(bounds.width, MIN_FIT_WIDTH);
        const height = Math.max(bounds.height, MIN_FIT_HEIGHT);
        const frame = {
          x: bounds.x - (width - bounds.width) / 2,
          y: bounds.y - (height - bounds.height) / 2,
          width,
          height,
        };
        fitBounds(frame, { padding: FIT_PADDING, duration });
      }
    },
    [fitBounds]
  );

  // Re-fit whenever a different automaton is shown (new expression / view) or
  // the canvas is resized, so the first fit never uses a stale container size.
  useEffect(() => {
    if (flowReady && viewportWidth > 0 && viewportHeight > 0) {
      fitContent();
    }
  }, [flowReady, graphKey, viewportWidth, viewportHeight, fitContent]);

  const handleFit = useCallback(() => fitContent(200), [fitContent]);
  const handleReset = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
    fitContent(200);
  }, [fitContent, setViewport]);

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
        } else if (change.type === 'dimensions' && change.dimensions) {
          const prevSize = prev[change.id]?.measured;
          if (
            prevSize?.width !== change.dimensions.width ||
            prevSize?.height !== change.dimensions.height
          ) {
            next ??= { ...prev };
            next[change.id] = { ...next[change.id], measured: { ...change.dimensions } };
          }
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
            onInit={handleInit}
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
            {showMiniMap && (
              <MiniMap
                pannable
                zoomable
                ariaLabel="Automata minimap"
                className="automata-graph__minimap"
              />
            )}
          </ReactFlow>
        ) : (
          <EmptyGraphState />
        )}
        {children}
      </div>
      <figcaption className="automata-graph__footer">
        <GraphLegend kind={kind} />
        <GraphControls
          onFitView={handleFit}
          onReset={handleReset}
          onToggleMiniMap={handleToggleMiniMap}
          isMiniMapVisible={showMiniMap}
        />
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

/** Key of the manually dragged positions (ignores selection-only overrides). */
function positionKey(overrides: Record<string, NodeOverride>): string {
  return Object.keys(overrides)
    .sort()
    .filter((id) => overrides[id].position)
    .map((id) => `${id}:${overrides[id].position!.x},${overrides[id].position!.y}`)
    .join(';');
}

/** Stable key for the current graph identity (used to reset drag overrides). */
function layoutKey(graph: AdaptedGraph | null): string {
  if (!graph) return '';
  return graph.nodes.map((n) => n.id).join(',') + '|' + graph.edges.map((e) => e.id).join(',');
}
