/**
 * A labelled transition between two states.
 *
 * OWNER: Person 2.
 * Custom React Flow edge supporting normal transitions, merged multi-character
 * labels, epsilon transitions (dashed), self-loops, parallel-edge offsets, and
 * simulation highlighting.
 *
 * Visual contract (docs/VISUALIZATION_SPEC.md):
 *   symbol edge   solid line, label `a` or `a, b` for merged transitions
 *   parallel      separate curves via vertical control-point bow (`parallelOffset`)
 *   ε edge        dashed line, label `ε` (never the literal null)
 *   self-loop     smooth loop above the node with label outside
 *   highlighted   accent/warning stroke and heavier label
 */

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';
import type { TransitionEdgeData } from '../types';

export type TransitionEdgeType = Edge<TransitionEdgeData, 'transition'>;

/**
 * Build a cubic Bézier whose control points are shifted vertically by `bowPx`.
 * Unlike `getBezierPath({ curvature })`, this always separates parallel edges
 * even when source/target share the same Y (where curvature is ignored).
 */
function getBowedBezierPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  bowPx: number
): [string, number, number] {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  // Control points along the chord, then offset vertically.
  const c1x = sourceX + dx * 0.25;
  const c1y = sourceY + dy * 0.25 + bowPx;
  const c2x = sourceX + dx * 0.75;
  const c2y = sourceY + dy * 0.75 + bowPx;
  // Label at t = 0.5 of the cubic.
  const labelX = 0.125 * sourceX + 0.375 * c1x + 0.375 * c2x + 0.125 * targetX;
  const labelY = 0.125 * sourceY + 0.375 * c1y + 0.375 * c2y + 0.125 * targetY;
  const path = `M ${sourceX} ${sourceY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${targetX} ${targetY}`;
  return [path, labelX, labelY];
}

export function TransitionEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps<TransitionEdgeType>) {
  const isSelfLoop = source === target;
  const isEpsilon = Boolean(data?.isEpsilon);
  const isHighlighted = Boolean(data?.isHighlighted);
  const parallelOffset = data?.parallelOffset ?? 0;

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (isSelfLoop) {
    // Render a smooth loop above the node; parallel self-loops grow taller
    const loopRadius = 24 + (data?.parallelIndex ?? 0) * 20;
    const x = sourceX;
    const y = sourceY;
    edgePath = `M ${x - 12} ${y} C ${x - loopRadius * 1.5} ${y - loopRadius * 2.2}, ${x + loopRadius * 1.5} ${y - loopRadius * 2.2}, ${x + 12} ${y}`;
    labelX = x;
    labelY = y - loopRadius * 2.4;
  } else if (Math.abs(parallelOffset) > 0.5) {
    // Parallel / bidirectional sibling: use a vertical bow so paths never
    // collapse onto each other (curvature alone is ignored for same-Y edges).
    [edgePath, labelX, labelY] = getBowedBezierPath(
      sourceX,
      sourceY,
      targetX,
      targetY,
      parallelOffset
    );
  } else {
    // Single non-parallel edge: default React Flow Bézier.
    const isBackEdge = sourceX > targetX;
    const curvature = isBackEdge ? 0.4 : 0.15;
    const [bezierPath, bx, by] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature,
    });
    edgePath = bezierPath;
    labelX = bx;
    labelY = by;
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

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        className={pathClassName}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="transition-edge-label-container"
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
