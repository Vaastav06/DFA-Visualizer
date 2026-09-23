/**
 * A single node in the syntax tree diagram.
 *
 * OWNER: Person 2.
 * Custom React Flow node displaying operators, symbols, leaf positions,
 * analysis tooltips (nullable, firstpos, lastpos), and a details card when
 * the node is selected.
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

      {/* Details revealed on selection */}
      {isSelected && (
        <div className="graph-node-details" role="status">
          <div className="graph-node-details__status">
            {data.type}
            {data.position !== undefined ? ` · pos ${data.position}` : ''}
          </div>
          <div className="graph-node-details__line">Nullable: {String(data.nullable)}</div>
          <div className="graph-node-details__line">{`Firstpos: {${data.firstpos.join(', ')}}`}</div>
          <div className="graph-node-details__line">{`Lastpos: {${data.lastpos.join(', ')}}`}</div>
        </div>
      )}
    </div>
  );
}
