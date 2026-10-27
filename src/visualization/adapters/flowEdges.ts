/**
 * Adapted graph -> routed React Flow edges.
 *
 * OWNER: Person 2.
 *
 * Pure helpers used by `AutomataGraph` (kept out of the component so routing
 * and highlighting can be tested without a browser):
 *  - `routeGraph`      node top-left positions -> routed geometry per edge
 *  - `buildFlowEdges`  adapter edges + routing + highlight -> React Flow edges
 *
 * Neither function mutates the adapted graph or compiler output.
 */

import { MarkerType } from '@xyflow/react';
import type { GraphHighlight } from '../types';
import type { TransitionEdgeType } from '../components/TransitionEdge';
import type { AdaptedGraph } from './graphTypes';
import {
  routeEdges,
  STATE_NODE_SIZE,
  type RouteNode,
  type RoutingResult,
} from '../layout/edgeRouting';
import { edgeColor } from '../graphColors';

type HighlightedTransition = { from: number; to: number; symbol?: string };

/** Route all edges of `graph` given each node's top-left position. */
export function routeGraph(
  graph: AdaptedGraph,
  positionOf: (nodeId: string, stateId: number) => { x: number; y: number }
): RoutingResult {
  const half = STATE_NODE_SIZE / 2;
  const nodes: RouteNode[] = graph.nodes.map((node) => {
    const pos = positionOf(node.id, node.data.stateId);
    return { id: node.id, x: pos.x + half, y: pos.y + half, isStart: node.data.isStart };
  });
  const edges = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.data.label,
  }));
  return routeEdges(nodes, edges);
}

export function buildFlowEdges(
  graph: AdaptedGraph,
  routing: RoutingResult | null,
  highlight?: GraphHighlight,
  highlightedTransition?: HighlightedTransition | null
): TransitionEdgeType[] {
  return graph.edges.map((edge) => {
    const from = Number(edge.source);
    const to = Number(edge.target);
    const matches = (ht: HighlightedTransition) =>
      ht.from === from &&
      ht.to === to &&
      (ht.symbol === undefined || edge.data.symbols.includes(ht.symbol));

    const isHighlighted =
      Boolean(highlight?.transitions?.some(matches)) ||
      Boolean(highlightedTransition && matches(highlightedTransition));

    // Handles only gate React Flow's rendering; the path comes from `route`.
    const isSelfLoop = from === to;
    const sourceHandle = isSelfLoop ? 'top' : 'right';
    const targetHandle = isSelfLoop ? 'top-target' : 'left';

    // Use explicit hex colors so SVG markerEnd url(#...) does not include
    // unescaped parentheses from CSS vars (e.g. var(--edge)), ensuring markers
    // render properly in browser and export crisply to PNG/JPEG.
    const markerColor = edgeColor(isHighlighted, edge.data.isEpsilon);

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle,
      targetHandle,
      type: 'transition',
      // Highlighted edges draw above the rest where several converge on a state.
      zIndex: isHighlighted ? 1 : 0,
      data: {
        ...edge.data,
        isHighlighted,
        route: routing?.routes.get(edge.id),
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: markerColor,
        width: 18,
        height: 18,
      },
    };
  });
}
