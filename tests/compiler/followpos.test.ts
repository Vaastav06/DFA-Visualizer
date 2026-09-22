import { describe, expect, it } from 'vitest';
import { buildSyntaxTree } from '../../src/compiler/syntaxTree';
import { assignPositions } from '../../src/compiler/positions';
import { calculateNullable } from '../../src/compiler/nullable';
import { calculateFirstpos } from '../../src/compiler/firstpos';
import { calculateLastpos } from '../../src/compiler/lastpos';
import { calculateFollowpos } from '../../src/compiler/followpos';
import { infixToPostfix } from '../../src/compiler/infixToPostfix';
import { insertExplicitConcatenation } from '../../src/compiler/explicitConcatenation';
import { tokenize } from '../../src/compiler/tokenizer';

function computeFollowpos(regex: string) {
  const postfix = infixToPostfix(insertExplicitConcatenation(tokenize(regex)));
  const tree = buildSyntaxTree(postfix, true);
  const { positions } = assignPositions(tree);
  calculateNullable(tree);
  calculateFirstpos(tree);
  calculateLastpos(tree);
  return { tree, positions, followpos: calculateFollowpos(tree, positions) };
}

describe('followpos calculation', () => {
  it('computes textbook followpos table for (a|b)*abb#', () => {
    const { followpos } = computeFollowpos('(a|b)*abb');

    // Expected table from Dragon Book Example 3.36:
    // 1 (a) -> {1, 2, 3}
    // 2 (b) -> {1, 2, 3}
    // 3 (a) -> {4}
    // 4 (b) -> {5}
    // 5 (b) -> {6}
    // 6 (#) -> {}
    expect(followpos).toEqual([
      { position: 1, symbol: 'a', followpos: [1, 2, 3] },
      { position: 2, symbol: 'b', followpos: [1, 2, 3] },
      { position: 3, symbol: 'a', followpos: [4] },
      { position: 4, symbol: 'b', followpos: [5] },
      { position: 5, symbol: 'b', followpos: [6] },
      { position: 6, symbol: '#', followpos: [] },
    ]);
  });

  it('computes followpos for ab#', () => {
    const { followpos } = computeFollowpos('ab');

    expect(followpos).toEqual([
      { position: 1, symbol: 'a', followpos: [2] },
      { position: 2, symbol: 'b', followpos: [3] },
      { position: 3, symbol: '#', followpos: [] },
    ]);
  });

  it('computes followpos for a*# with self-loop and end-marker transition', () => {
    const { followpos } = computeFollowpos('a*');

    expect(followpos).toEqual([
      { position: 1, symbol: 'a', followpos: [1, 2] },
      { position: 2, symbol: '#', followpos: [] },
    ]);
  });

  it('computes followpos for (a|b)*#', () => {
    const { followpos } = computeFollowpos('(a|b)*');

    expect(followpos).toEqual([
      { position: 1, symbol: 'a', followpos: [1, 2, 3] },
      { position: 2, symbol: 'b', followpos: [1, 2, 3] },
      { position: 3, symbol: '#', followpos: [] },
    ]);
  });

  it('ensures all followpos sets are sorted ascending and duplicate-free', () => {
    const { followpos } = computeFollowpos('(a|b)(c|d)*');

    for (const entry of followpos) {
      expect(entry.followpos).toEqual([...new Set(entry.followpos)].sort((a, b) => a - b));
    }
  });
});
