/**
 * A labelled transition between two states.
 *
 * OWNER: Person 2.
 * Custom React Flow edge supporting normal transitions, merged multi-character
 * labels, epsilon transitions (dashed), self-loops, and simulation highlighting.
 *
 * Visual contract (docs/VISUALIZATION_SPEC.md):
 *   symbol edge   solid line, label `a` or `a, b` for merged transitions
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

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (isSelfLoop) {
    // Render a smooth loop above the node
    const loopRadius = 24;
    const x = sourceX;
    const y = sourceY;
    edgePath = `M ${x - 12} ${y} C ${x - loopRadius * 1.5} ${y - loopRadius * 2.2}, ${x + loopRadius * 1.5} ${y - loopRadius * 2.2}, ${x + 12} ${y}`;
    labelX = x;
    labelY = y - loopRadius * 2.4;
  } else {
    // Regular or bidirectional edge
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
