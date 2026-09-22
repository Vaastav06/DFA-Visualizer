/**
 * PUBLIC COMPONENT — renders the augmented Syntax Tree.
 *
 * OWNER: Person 2. Consumed by Person 3 as:
 *   <SyntaxTreeGraph tree={result.syntaxTree} />
 */

import { useCallback, useMemo } from 'react';
import { Background, ReactFlow, ReactFlowProvider, type Edge, type Node } from '@xyflow/react';

import type { SyntaxTreeGraphProps, SyntaxTreeNodeData } from '../types';
import { adaptSyntaxTree } from '../adapters/syntaxTreeAdapter';
import { layoutSyntaxTree } from '../layout/treeLayout';
import { SyntaxTreeNode, type SyntaxTreeNodeType } from './SyntaxTreeNode';
import { EmptyGraphState } from './EmptyGraphState';
import { GraphControls } from './GraphControls';
import { GraphLegend } from './GraphLegend';

import '@xyflow/react/dist/style.css';
import '../AutomataGraph.css';

const treeNodeTypes = {
  treeNode: SyntaxTreeNode,
};

function SyntaxTreeGraphInner({
  tree,
  height,
  className,
  highlightedPositions,
  onNodeClick,
  selectedNodeId,
}: SyntaxTreeGraphProps) {
  const hasContent = Boolean(tree);

  const adapted = useMemo(() => adaptSyntaxTree(tree), [tree]);
  const layout = useMemo(() => layoutSyntaxTree(tree), [tree]);

  const flowNodes: SyntaxTreeNodeType[] = useMemo(() => {
    if (!hasContent) return [];

    return adapted.nodes.map((node) => {
      const pos = layout.get(node.data.nodeId) ?? { x: 0, y: 0 };
      const isHighlighted =
        node.data.position !== undefined &&
        Boolean(highlightedPositions?.includes(node.data.position));
      const isSelected =
        selectedNodeId !== undefined && selectedNodeId !== null
          ? selectedNodeId === node.data.nodeId
          : Boolean(node.data.isSelected);

      return {
        id: node.id,
        type: 'treeNode',
        position: pos,
        data: {
          ...node.data,
          isHighlighted,
          isSelected,
        },
      };
    });
  }, [hasContent, adapted.nodes, layout, highlightedPositions, selectedNodeId]);

  const flowEdges: Edge[] = useMemo(() => {
    if (!hasContent) return [];

    return adapted.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      style: { stroke: 'var(--edge)', strokeWidth: 2 },
    }));
  }, [hasContent, adapted.edges]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeData = node.data as SyntaxTreeNodeData;
      if (onNodeClick && nodeData?.nodeId !== undefined) {
        onNodeClick(nodeData.nodeId, nodeData);
      }
    },
    [onNodeClick]
  );

  return (
    <figure
      className={['automata-graph', 'syntax-tree-graph', className].filter(Boolean).join(' ')}
      style={height === undefined ? undefined : { height }}
      aria-label="Syntax Tree Diagram"
    >
      <div className="automata-graph__canvas">
        {hasContent ? (
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={treeNodeTypes}
            onNodeClick={handleNodeClick}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={2.5}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            zoomOnScroll={true}
            panOnDrag={true}
            proOptions={{ hideAttribution: true }}
            aria-label="Syntax tree canvas"
          >
            <Background gap={20} size={1} color="var(--border)" />
          </ReactFlow>
        ) : (
          <EmptyGraphState message="No syntax tree available yet. Enter a regular expression to begin." />
        )}
      </div>
      <figcaption className="automata-graph__footer">
        <GraphLegend kind="syntax-tree" />
        <GraphControls />
      </figcaption>
    </figure>
  );
}

export function SyntaxTreeGraph(props: SyntaxTreeGraphProps) {
  return (
    <ReactFlowProvider>
      <SyntaxTreeGraphInner {...props} />
    </ReactFlowProvider>
  );
}
