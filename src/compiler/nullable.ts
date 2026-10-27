/**
 * Stage 5c - Nullable Calculation.
 *
 * CONTRACT: determines whether a syntax tree node can match the empty string (ε).
 *
 * Rules:
 *  - symbol: false (including end-marker #)
 *  - union(A, B): nullable(A) || nullable(B)
 *  - concat(A, B): nullable(A) && nullable(B)
 *  - star(A): true
 */

import type { SyntaxNode } from './types';

/**
 * Computes and sets `nullable` for `node` and all of its descendants.
 *
 * @param node The syntax tree node to analyze.
 * @returns The boolean nullable verdict for this node.
 */
export function calculateNullable(node: SyntaxNode): boolean {
  switch (node.type) {
    case 'symbol':
      node.nullable = false;
      break;

    case 'union': {
      const leftNullable = node.left ? calculateNullable(node.left) : false;
      const rightNullable = node.right ? calculateNullable(node.right) : false;
      node.nullable = leftNullable || rightNullable;
      break;
    }

    case 'concat': {
      const leftNullable = node.left ? calculateNullable(node.left) : false;
      const rightNullable = node.right ? calculateNullable(node.right) : false;
      node.nullable = leftNullable && rightNullable;
      break;
    }

    case 'star': {
      if (node.left) {
        calculateNullable(node.left);
      }
      node.nullable = true;
      break;
    }
  }

  return node.nullable;
}
