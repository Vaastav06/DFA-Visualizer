/**
 * SyntaxTree -> graph adapter.
 *
 * Converts an augmented SyntaxNode tree into nodes and edges for React Flow.
 */

import type { SyntaxNode } from '../../compiler/types';
import type { SyntaxTreeNodeData } from '../types';

export interface TreeGraphNode {
  id: string;
  data: SyntaxTreeNodeData;
}

export interface TreeGraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface AdaptedSyntaxTree {
  nodes: TreeGraphNode[];
  edges: TreeGraphEdge[];
  rootId?: string;
}

/** Formats a syntax node type into its conventional display label. */
export function formatNodeLabel(node: SyntaxNode): string {
  switch (node.type) {
    case 'union':
      return '|';
    case 'concat':
      return '•';
    case 'star':
      return '*';
    case 'symbol':
      return node.symbol ?? '';
    default:
      return '';
  }
}

export function adaptSyntaxTree(tree: SyntaxNode | null | undefined): AdaptedSyntaxTree {
  if (!tree) {
    return { nodes: [], edges: [] };
  }

  const nodes: TreeGraphNode[] = [];
  const edges: TreeGraphEdge[] = [];

  function traverse(node: SyntaxNode) {
    const isEndMarker = node.type === 'symbol' && node.symbol === '#';

    nodes.push({
      id: String(node.id),
      data: {
        nodeId: node.id,
        type: node.type,
        label: formatNodeLabel(node),
        symbol: node.symbol,
        position: node.position,
        nullable: node.nullable,
        firstpos: [...(node.firstpos ?? [])],
        lastpos: [...(node.lastpos ?? [])],
        isEndMarker,
      },
    });

    if (node.left) {
      edges.push({
        id: `e${node.id}-${node.left.id}`,
        source: String(node.id),
        target: String(node.left.id),
      });
      traverse(node.left);
    }

    if (node.right) {
      edges.push({
        id: `e${node.id}-${node.right.id}`,
        source: String(node.id),
        target: String(node.right.id),
      });
      traverse(node.right);
    }
  }

  traverse(tree);

  return {
    nodes,
    edges,
    rootId: String(tree.id),
  };
}
