/**
 * A single automaton state.
 *
 * OWNER: Person 2.
 * TODO(Person 2): render as a React Flow custom node with handles.
 *
 * Visual contract (docs/VISUALIZATION_SPEC.md):
 *   normal state    single border
 *   accepting state double border
 *   start state     incoming start arrow
 *   highlighted     accent colour while a simulation step is on this state
 */

import type { StateNodeData } from '../types';

interface StateNodeProps {
  data: StateNodeData;
}

export function StateNode({ data }: StateNodeProps) {
  const classNames = [
    'state-node',
    data.isAccepting ? 'state-node--accepting' : '',
    data.isStart ? 'state-node--start' : '',
    data.isHighlighted ? 'state-node--highlighted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      title={data.nfaStates ? `{${data.nfaStates.join(', ')}}` : undefined}
    >
      {data.label}
    </div>
  );
}
