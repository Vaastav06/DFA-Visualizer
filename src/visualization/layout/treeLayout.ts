/**
 * Deterministic Hierarchical Syntax Tree Layout.
 *
 * OWNER: Person 2.
 * Computes (x, y) coordinates for binary syntax trees ensuring:
 *  - Parent nodes are placed vertically above their children
 *  - Left children are positioned to the left, right children to the right
 *  - Parents are centered horizontally over their subtrees
 *  - 100% deterministic layout across re-renders
 */

import type { SyntaxNode } from '../../compiler/types';
import type { Position } from './layoutTypes';

export interface TreeLayoutOptions {
  levelSpacing?: number;
  nodeSpacing?: number;
  startY?: number;
  startX?: number;
}

export const DEFAULT_TREE_LAYOUT_OPTIONS: Required<TreeLayoutOptions> = {
  levelSpacing: 80,
  nodeSpacing: 70,
  startY: 40,
  startX: 60,
};

export type TreeLayoutResult = Map<number, Position>;

export function layoutSyntaxTree(
  tree: SyntaxNode | null | undefined,
  options: TreeLayoutOptions = {}
): TreeLayoutResult {
  const result: TreeLayoutResult = new Map();
  if (!tree) {
    return result;
  }

  const { levelSpacing, nodeSpacing, startY, startX } = {
    ...DEFAULT_TREE_LAYOUT_OPTIONS,
    ...options,
  };

  let currentLeafX = startX;

  // Bottom-up post-order assignment:
  // Leaves receive successive x coordinates, parents take the average of children
  function assignPositions(node: SyntaxNode, depth: number): Position {
    const y = startY + depth * levelSpacing;

    if (!node.left && !node.right) {
      // Leaf node
      const x = currentLeafX;
      currentLeafX += nodeSpacing;
      const pos = { x: Math.round(x), y: Math.round(y) };
      result.set(node.id, pos);
      return pos;
    }

    if (node.left && !node.right) {
      // Unary node (e.g. Kleene star)
      const leftPos = assignPositions(node.left, depth + 1);
      const x = leftPos.x;
      const pos = { x: Math.round(x), y: Math.round(y) };
      result.set(node.id, pos);
      return pos;
    }

    if (!node.left && node.right) {
      const rightPos = assignPositions(node.right, depth + 1);
      const x = rightPos.x;
      const pos = { x: Math.round(x), y: Math.round(y) };
      result.set(node.id, pos);
      return pos;
    }

    // Binary node (e.g. concat or union)
    const leftPos = assignPositions(node.left!, depth + 1);
    const rightPos = assignPositions(node.right!, depth + 1);
    const x = (leftPos.x + rightPos.x) / 2;
    const pos = { x: Math.round(x), y: Math.round(y) };
    result.set(node.id, pos);
    return pos;
  }

  assignPositions(tree, 0);

  return result;
}
