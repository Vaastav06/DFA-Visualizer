import { describe, expect, it } from 'vitest';
import { buildSyntaxTree } from '../../src/compiler/syntaxTree';
import { assignPositions } from '../../src/compiler/positions';
import { calculateNullable } from '../../src/compiler/nullable';
import { calculateLastpos } from '../../src/compiler/lastpos';
import { infixToPostfix } from '../../src/compiler/infixToPostfix';
import { insertExplicitConcatenation } from '../../src/compiler/explicitConcatenation';
import { tokenize } from '../../src/compiler/tokenizer';

function analyzeTree(regex: string, augment = false) {
  const postfix = infixToPostfix(insertExplicitConcatenation(tokenize(regex)));
  const tree = buildSyntaxTree(postfix, augment);
  assignPositions(tree);
  calculateNullable(tree);
  calculateLastpos(tree);
  return tree;
}

describe('lastpos calculation', () => {
  it('symbol node lastpos contains only its own position', () => {
    const tree = analyzeTree('a', false);
    expect(tree.lastpos).toEqual([1]);
  });

  it('union node lastpos is union of children lastpos', () => {
    const tree = analyzeTree('a|b', false);
    expect(tree.lastpos).toEqual([1, 2]);
  });

  it('concat node lastpos is right child when right is not nullable', () => {
    const tree = analyzeTree('ab', false);
    expect(tree.lastpos).toEqual([2]);
  });

  it('concat node lastpos is union when right child is nullable', () => {
    const tree = analyzeTree('ab*', false);
    expect(tree.lastpos).toEqual([1, 2]);
  });

  it('star node lastpos equals child lastpos', () => {
    const tree = analyzeTree('(a|b)*', false);
    expect(tree.lastpos).toEqual([1, 2]);
  });

  it('augmented tree has lastpos containing only the end-marker position', () => {
    const tree = analyzeTree('(a|b)*abb', true);
    // Position 6 is '#'
    expect(tree.lastpos).toEqual([6]);
  });

  it('returns sorted deduplicated arrays', () => {
    const tree = analyzeTree('a*b*|c*', false);
    expect(tree.lastpos).toEqual([...new Set(tree.lastpos)].sort((a, b) => a - b));
  });
});
