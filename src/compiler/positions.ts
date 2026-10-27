/**
 * Stage 5b - Position Numbering.
 *
 * CONTRACT: assigns unique, 1-based integer position numbers to every leaf
 * (symbol or end-marker) in the syntax tree using deterministic left-to-right
 * traversal.
 *
 * Example: `(a|b)*abb#`
 *   Position 1 -> 'a'
 *   Position 2 -> 'b'
 *   Position 3 -> 'a'
 *   Position 4 -> 'b'
 *   Position 5 -> 'b'
 *   Position 6 -> '#'
 */

import { END_MARKER } from './syntaxTree';
import type { PositionInfo, SyntaxNode } from './types';

export interface PositionAssignmentResult {
  positions: PositionInfo[];
  endMarkerPosition: number;
}

/**
 * Traverses the syntax tree left-to-right, numbering all leaf symbol nodes
 * with consecutive 1-based position integers.
 * Mutates `node.position` on each leaf and returns the complete position table.
 */
export function assignPositions(root: SyntaxNode): PositionAssignmentResult {
  const positions: PositionInfo[] = [];
  let currentPosition = 1;
  let endMarkerPosition = -1;

  function traverse(node: SyntaxNode): void {
    if (node.type === 'symbol') {
      const pos = currentPosition++;
      node.position = pos;
      const symbol = node.symbol ?? '';
      positions.push({ position: pos, symbol });
      if (symbol === END_MARKER) {
        endMarkerPosition = pos;
      }
      return;
    }

    if (node.left) {
      traverse(node.left);
    }
    if (node.right) {
      traverse(node.right);
    }
  }

  traverse(root);

  return {
    positions,
    endMarkerPosition,
  };
}
