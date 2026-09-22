import { describe, expect, it } from 'vitest';
import { buildSyntaxTree } from '../../src/compiler/syntaxTree';
import { assignPositions } from '../../src/compiler/positions';
import { calculateNullable } from '../../src/compiler/nullable';
import { calculateFirstpos } from '../../src/compiler/firstpos';
import { infixToPostfix } from '../../src/compiler/infixToPostfix';
import { insertExplicitConcatenation } from '../../src/compiler/explicitConcatenation';
import { tokenize } from '../../src/compiler/tokenizer';

function analyzeTree(regex: string, augment = true) {
  const postfix = infixToPostfix(insertExplicitConcatenation(tokenize(regex)));
  const tree = buildSyntaxTree(postfix, augment);
  assignPositions(tree);
  calculateNullable(tree);
  calculateFirstpos(tree);
  return tree;
}

describe('firstpos calculation', () => {
  it('symbol node firstpos contains only its own position', () => {
    const tree = analyzeTree('a', false);
    expect(tree.firstpos).toEqual([1]);
  });

  it('union node firstpos is union of children firstpos', () => {
    const tree = analyzeTree('a|b', false);
    expect(tree.firstpos).toEqual([1, 2]);
  });

  it('concat node firstpos is left child when left is not nullable', () => {
    const tree = analyzeTree('ab', false);
    expect(tree.firstpos).toEqual([1]);
  });

  it('concat node firstpos is union when left child is nullable', () => {
    const tree = analyzeTree('a*b', false);
    expect(tree.firstpos).toEqual([1, 2]);
  });

  it('star node firstpos equals child firstpos', () => {
    const tree = analyzeTree('(a|b)*', false);
    expect(tree.firstpos).toEqual([1, 2]);
  });

  it('computes correct firstpos for textbook (a|b)*abb#', () => {
    // In (a|b)*abb#, leaves are: 1:a, 2:b, 3:a, 4:b, 5:b, 6:#
    // Left child of root is ((a|b)*abb)
    // (a|b)* is nullable, so firstpos includes {1, 2} and firstpos of 'a' (pos 3)
    const tree = analyzeTree('(a|b)*abb', true);
    expect(tree.firstpos).toEqual([1, 2, 3]);
  });

  it('returns sorted deduplicated arrays', () => {
    const tree = analyzeTree('(a|a)*', false);
    expect(tree.firstpos).toEqual([1, 2]);
  });
});
