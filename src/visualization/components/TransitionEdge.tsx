/**
 * A labelled transition between two states.
 *
 * OWNER: Person 2.
 * TODO(Person 2): render as a React Flow custom edge with a label and an
 * arrow marker; self-loops need their own path.
 *
 * Visual contract (docs/VISUALIZATION_SPEC.md):
 *   symbol edge   solid line, label `a` or `a, b` for merged transitions
 *   ε edge        dashed line, label `ε` (never the literal null)
 */

import type { TransitionEdgeData } from '../types';

interface TransitionEdgeProps {
  data: TransitionEdgeData;
}

export function TransitionEdge({ data }: TransitionEdgeProps) {
  const classNames = [
    'transition-edge',
    data.isEpsilon ? 'transition-edge--epsilon' : '',
    data.isHighlighted ? 'transition-edge--highlighted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classNames}>{data.label}</span>;
}
