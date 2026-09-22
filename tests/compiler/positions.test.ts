import { describe, expect, it } from 'vitest';
import { buildSyntaxTree } from '../../src/compiler/syntaxTree';
import { assignPositions } from '../../src/compiler/positions';
import { infixToPostfix } from '../../src/compiler/infixToPostfix';
import { insertExplicitConcatenation } from '../../src/compiler/explicitConcatenation';
import { tokenize } from '../../src/compiler/tokenizer';

function getTree(regex: string) {
  const postfix = infixToPostfix(insertExplicitConcatenation(tokenize(regex)));
  return buildSyntaxTree(postfix, true);
}

describe('position numbering', () => {
  it('numbers a single symbol and end-marker 1-based left-to-right', () => {
    const tree = getTree('a');
    const { positions, endMarkerPosition } = assignPositions(tree);

    expect(positions).toEqual([
      { position: 1, symbol: 'a' },
      { position: 2, symbol: '#' },
    ]);
    expect(endMarkerPosition).toBe(2);
  });

  it('numbers concatenation ab# as 1->a, 2->b, 3->#', () => {
    const tree = getTree('ab');
    const { positions, endMarkerPosition } = assignPositions(tree);

    expect(positions).toEqual([
      { position: 1, symbol: 'a' },
      { position: 2, symbol: 'b' },
      { position: 3, symbol: '#' },
    ]);
    expect(endMarkerPosition).toBe(3);
  });

  it('numbers the textbook expression (a|b)*abb# exactly as 1:a, 2:b, 3:a, 4:b, 5:b, 6:#', () => {
    const tree = getTree('(a|b)*abb');
    const { positions, endMarkerPosition } = assignPositions(tree);

    expect(positions).toEqual([
      { position: 1, symbol: 'a' },
      { position: 2, symbol: 'b' },
      { position: 3, symbol: 'a' },
      { position: 4, symbol: 'b' },
      { position: 5, symbol: 'b' },
      { position: 6, symbol: '#' },
    ]);
    expect(endMarkerPosition).toBe(6);
  });

  it('numbers union and grouping (a|b)(c|d)# deterministically', () => {
    const tree = getTree('(a|b)(c|d)');
    const { positions, endMarkerPosition } = assignPositions(tree);

    expect(positions).toEqual([
      { position: 1, symbol: 'a' },
      { position: 2, symbol: 'b' },
      { position: 3, symbol: 'c' },
      { position: 4, symbol: 'd' },
      { position: 5, symbol: '#' },
    ]);
    expect(endMarkerPosition).toBe(5);
  });

  it('produces identical numbering across repeated calls', () => {
    const tree1 = getTree('(a|b)*abb');
    const tree2 = getTree('(a|b)*abb');
    const res1 = assignPositions(tree1);
    const res2 = assignPositions(tree2);

    expect(res1).toEqual(res2);
  });
});
