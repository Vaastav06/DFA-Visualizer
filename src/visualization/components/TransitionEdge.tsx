/**
 * A labelled transition between two states.
 *
 * OWNER: Person 2.
 * Custom React Flow edge supporting normal transitions, merged multi-character
 * labels, epsilon transitions (dashed), self-loops, parallel edges, and
 * simulation highlighting.
 *
 * Geometry is NOT computed here: `AutomataGraph` routes every edge at once via
 * `layout/edgeRouting.ts` (which needs to see all edges to keep them apart) and
 * passes the result in `data.route`. This component only draws it.
 *
 * Visual contract (docs/VISUALIZATION_SPEC.md):
 *   symbol edge   solid line, label `a` or `a, b` for merged transitions
 *   parallel      siblings / reverse edges bow to distinct sides of the chord
 *   long / back   arcs routed on outer lanes around unrelated states
 *   ε edge        dashed line, label `ε` (never the literal null)
 *   self-loop     loop in the freest direction around the state, label outside
 *   highlighted   accent/warning stroke and heavier label
 */

import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';
import type { TransitionEdgeData } from '../types';
import { edgeColor } from '../graphColors';

export type TransitionEdgeType = Edge<TransitionEdgeData, 'transition'>;

export function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  data,
}: EdgeProps<TransitionEdgeType>) {
  const isEpsilon = Boolean(data?.isEpsilon);
  const isHighlighted = Boolean(data?.isHighlighted);
  const route = data?.route;

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (route) {
    edgePath = route.path;
    labelX = route.label.x;
    labelY = route.label.y;
  } else {
    // Unrouted fallback (e.g. a node not yet positioned): plain handle-to-handle line.
    [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  }

  const pathClassName = [
    'transition-edge-path',
    isEpsilon ? 'transition-edge-path--epsilon' : '',
    isHighlighted ? 'transition-edge-path--highlighted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const labelClassName = [
    'transition-edge-label',
    isEpsilon ? 'transition-edge-label--epsilon' : '',
    isHighlighted ? 'transition-edge-label--highlighted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const strokeColor = edgeColor(Boolean(isHighlighted), Boolean(isEpsilon));

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: isHighlighted ? 3 : 2,
          ...style,
        }}
        markerEnd={markerEnd}
        className={pathClassName}
        interactionWidth={14}
      />
      {isHighlighted && edgePath && (
        <circle r="4.5" className="transition-edge-pulse">
          <animateMotion dur="0.9s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="transition-edge-label-container"
            data-edge-id={id}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <span className={labelClassName}>{data.label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
