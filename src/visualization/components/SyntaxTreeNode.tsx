/**
 * A single node in the syntax tree diagram.
 *
 * OWNER: Person 2.
 * Custom React Flow node displaying operators, symbols, leaf positions,
 * and analysis tooltips (nullable, firstpos, lastpos).
 */

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { SyntaxTreeNodeData } from '../types';

export type SyntaxTreeNodeType = Node<SyntaxTreeNodeData, 'treeNode'>;

export function SyntaxTreeNode({ data, selected }: NodeProps<SyntaxTreeNodeType>) {
  const isSelected = Boolean(data.isSelected || selected);

  const classNames = [
    'syntax-tree-node',
    `syntax-tree-node--${data.type}`,
    data.isEndMarker ? 'syntax-tree-node--end-marker' : '',
    data.isHighlighted ? 'syntax-tree-node--highlighted' : '',
    isSelected ? 'syntax-tree-node--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const tooltip = [
    `Node #${data.nodeId} (${data.type})`,
    data.position !== undefined ? `Position: ${data.position}` : '',
    `Nullable: ${data.nullable}`,
    `Firstpos: {${data.firstpos.join(', ')}}`,
    `Lastpos: {${data.lastpos.join(', ')}}`,
  ]
    .filter(Boolean)
    .join('\n');

  const ariaDescription = [
    `Node ${data.nodeId}`,
    data.isEndMarker ? 'end-marker #' : `${data.type} ${data.label}`,
    data.position !== undefined ? `position ${data.position}` : '',
    data.nullable ? 'nullable' : 'not nullable',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className={classNames}
      title={tooltip}
      role="graphics-symbol"
      aria-label={ariaDescription}
      tabIndex={0}
      data-node-id={data.nodeId}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="syntax-tree-node__handle"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="syntax-tree-node__handle"
        isConnectable={false}
      />

      <span className="syntax-tree-node__label">{data.label}</span>

      {data.position !== undefined && (
        <span
          className={`syntax-tree-node__pos ${data.isEndMarker ? 'syntax-tree-node__pos--end' : ''}`}
          aria-hidden="true"
        >
          {data.position}
        </span>
      )}
    </div>
  );
}

