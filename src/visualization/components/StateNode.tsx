/**
 * A single automaton state.
 *
 * OWNER: Person 2.
 * Custom node for React Flow with connection handles and visual indicators.
 *
 * Visual contract (docs/VISUALIZATION_SPEC.md):
 *   normal state    circle, single border
 *   accepting state circle, double border
 *   start state     circle with incoming arrow from nowhere
 *   highlighted     accent/warning colour while simulation step is on this state
 */

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { StateNodeData } from '../types';

export type StateNodeType = Node<StateNodeData, 'state'>;

export function StateNode({ data, selected }: NodeProps<StateNodeType>) {
  const isSelected = Boolean(data.isSelected || selected);

  const classNames = [
    'state-node',
    data.isAccepting ? 'state-node--accepting' : '',
    data.isStart ? 'state-node--start' : '',
    data.isHighlighted ? 'state-node--highlighted' : '',
    isSelected ? 'state-node--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const ariaDescription = [
    data.label,
    data.isStart ? '(start)' : '',
    data.isAccepting ? '(accepting)' : '',
    data.isHighlighted ? '(active)' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const tooltip =
    data.nfaStates && data.nfaStates.length > 0 ? `{${data.nfaStates.join(', ')}}` : undefined;

  return (
    <div
      className={classNames}
      title={tooltip}
      role="graphics-symbol"
      aria-label={ariaDescription}
      tabIndex={0}
      data-state-id={data.stateId}
    >
      {/* Target & Source handles for edge routing */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="state-node__handle"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="state-node__handle"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="state-node__handle"
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="state-node__handle"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="state-node__handle"
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="state-node__handle"
        isConnectable={false}
      />

      {/* Start state incoming arrow */}
      {data.isStart && (
        <span className="state-node__start-arrow" aria-hidden="true">
          <svg viewBox="0 0 28 16" width="28" height="16">
            <path
              d="M 2 8 L 22 8 M 16 3 L 22 8 L 16 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}

      {/* State label, e.g. q0 */}
      <span className="state-node__label">{data.label}</span>
    </div>
  );
}
