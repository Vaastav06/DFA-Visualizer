/**
 * Stage 5f - Followpos Calculation.
 *
 * CONTRACT: computes the followpos table for each leaf position in the syntax tree.
 *
 * Rules:
 *  1. Concatenation (A.B):
 *     For every i ∈ lastpos(A), add firstpos(B) to followpos(i).
 *
 *  2. Kleene Star (A*):
 *     For every i ∈ lastpos(A), add firstpos(A) to followpos(i).
 *
 * Invariant:
 *  - Every leaf position appears in the table.
 *  - Each followpos list is sorted in ascending order with no duplicates.
 *  - Followpos entries are ordered by position (1, 2, ...).
 */

import type { FollowPosEntry, PositionInfo, SyntaxNode } from './types';

/**
 * Calculates the complete followpos table for a syntax tree and its positions.
 *
 * @param root The root of the augmented syntax tree (with firstpos/lastpos computed).
 * @param positions The leaf position table.
 * @returns An array of FollowPosEntry, one per leaf position, sorted by position.
 */
export function calculateFollowpos(root: SyntaxNode, positions: PositionInfo[]): FollowPosEntry[] {
  const followposMap = new Map<number, Set<number>>();

  for (const posInfo of positions) {
    followposMap.set(posInfo.position, new Set<number>());
  }

  function traverse(node: SyntaxNode): void {
    if (node.type === 'concat') {
      const leftLast = node.left?.lastpos ?? [];
      const rightFirst = node.right?.firstpos ?? [];

      for (const i of leftLast) {
        const set = followposMap.get(i);
        if (set) {
          for (const j of rightFirst) {
            set.add(j);
          }
        }
      }
    } else if (node.type === 'star') {
      const childLast = node.left?.lastpos ?? [];
      const childFirst = node.left?.firstpos ?? [];

      for (const i of childLast) {
        const set = followposMap.get(i);
        if (set) {
          for (const j of childFirst) {
            set.add(j);
          }
        }
      }
    }

    if (node.left) {
      traverse(node.left);
    }
    if (node.right) {
      traverse(node.right);
    }
  }

  traverse(root);

  return positions.map((posInfo) => {
    const rawSet = followposMap.get(posInfo.position) ?? new Set<number>();
    return {
      position: posInfo.position,
      symbol: posInfo.symbol,
      followpos: [...rawSet].sort((a, b) => a - b),
    };
  });
}
