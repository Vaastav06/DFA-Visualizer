/**
 * A single DFA automaton state.
 *
 * OWNER: Person 2.
 * Custom node for React Flow with connection handles, start/accept indicators,
 * syntax-tree position sets, and simulation highlighting.
 *
 * Visual contract:
 *   normal state    circle, single border
 *   accepting state circle, double border
 *   start state     circle with incoming arrow from nowhere
 *   highlighted     accent/warning stroke while simulation step is on this state
 *   positions       displays syntax-tree position set {1, 2, 3}
 *   selected        details card below the node (status + positions)
 */

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { DEAD_STATE_ID, type StateNodeData } from '../types';

export type StateNodeType = Node<StateNodeData, 'state'>;

export function StateNode({ data, selected }: NodeProps<StateNodeType>) {
  const isSelected = Boolean(data.isSelected || selected);
  const isDead = Boolean(data.isDeadState || data.stateId === DEAD_STATE_ID);
  const posList = data.positions ?? [];
  const posString = isDead ? '∅' : posList.length > 0 ? `{${posList.join(',')}}` : '';

  const classNames = [
    'state-node',
    data.isAccepting ? 'state-node--accepting' : '',
    data.isStart ? 'state-node--start' : '',
    isDead ? 'state-node--dead' : '',
    data.isHighlighted ? 'state-node--highlighted' : '',
    data.isActive ? 'state-node--active' : '',
    isSelected ? 'state-node--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const ariaDescription = isDead
    ? `Dead state ${data.label}, trap state, non-accepting, positions ∅${
        data.isHighlighted || data.isActive ? ', active simulation state' : ''
      }`
    : [
        `State ${data.label}`,
        data.isStart ? '(start state)' : '',
        data.isAccepting ? '(accepting state)' : '',
        data.isHighlighted || data.isActive ? '(active simulation state)' : '',
        posList.length > 0 ? `positions ${posList.join(' ')}` : '',
      ]
        .filter(Boolean)
        .join(', ');

  const tooltip = isDead
    ? 'Dead state (trap state)\nNon-accepting\nPositions: ∅'
    : [
        data.isStart ? 'Start state' : '',
        data.isAccepting ? 'Accepting state' : 'Non-accepting state',
        posList.length > 0 ? `Positions: {${posList.join(', ')}}` : '',
      ]
        .filter(Boolean)
        .join('\n');

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  };

  return (
    <div
      className={classNames}
      title={tooltip}
      role="graphics-symbol"
      aria-label={ariaDescription}
      tabIndex={0}
      data-state-id={data.stateId}
      onKeyDown={handleKeyDown}
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

      {/* Syntax-tree leaf positions */}
      {posString && <span className="state-node__positions">{posString}</span>}

      {/* Details revealed on selection */}
      {isSelected && (
        <div className="graph-node-details" role="status">
          <div className="graph-node-details__status">
            {isDead ? 'Trap State (Dead State)' : data.isAccepting ? 'Accepting' : 'Non-accepting'}
            {data.isStart ? ' · start' : ''}
          </div>
          <div className="graph-node-details__line">
            {isDead
              ? 'Positions: ∅ (trap state)'
              : posList.length > 0
                ? `Positions: {${posList.join(', ')}}`
                : ''}
          </div>
        </div>
      )}
    </div>
  );
}
