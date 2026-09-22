import { describe, expect, it } from 'vitest';
import { buildSyntaxTree, END_MARKER } from '../../src/compiler/syntaxTree';
import { infixToPostfix } from '../../src/compiler/infixToPostfix';
import { insertExplicitConcatenation } from '../../src/compiler/explicitConcatenation';
import { tokenize } from '../../src/compiler/tokenizer';
import { InternalCompilerError } from '../../src/compiler/errors';

function toPostfix(regex: string): string[] {
  return infixToPostfix(insertExplicitConcatenation(tokenize(regex)));
}

describe('syntax tree construction', () => {
  it('builds a leaf node for a single symbol without augmentation', () => {
    const tree = buildSyntaxTree(['a'], false);
    expect(tree.type).toBe('symbol');
    expect(tree.symbol).toBe('a');
    expect(tree.id).toBe(1);
  });

  it('augments a single symbol with end-marker by default', () => {
    const tree = buildSyntaxTree(['a']);
    expect(tree.type).toBe('concat');
    expect(tree.left?.type).toBe('symbol');
    expect(tree.left?.symbol).toBe('a');
    expect(tree.right?.type).toBe('symbol');
    expect(tree.right?.symbol).toBe(END_MARKER);
  });

  it('builds a union node for a|b', () => {
    const tree = buildSyntaxTree(toPostfix('a|b'), false);
    expect(tree.type).toBe('union');
    expect(tree.left?.symbol).toBe('a');
    expect(tree.right?.symbol).toBe('b');
  });

  it('builds a concat node for ab', () => {
    const tree = buildSyntaxTree(toPostfix('ab'), false);
    expect(tree.type).toBe('concat');
    expect(tree.left?.symbol).toBe('a');
    expect(tree.right?.symbol).toBe('b');
  });

  it('builds a star node for a*', () => {
    const tree = buildSyntaxTree(toPostfix('a*'), false);
    expect(tree.type).toBe('star');
    expect(tree.left?.symbol).toBe('a');
  });

  it('respects precedence in tree structure for a|bc', () => {
    const tree = buildSyntaxTree(toPostfix('a|bc'), false);
    expect(tree.type).toBe('union');
    expect(tree.left?.symbol).toBe('a');
    expect(tree.right?.type).toBe('concat');
    expect(tree.right?.left?.symbol).toBe('b');
    expect(tree.right?.right?.symbol).toBe('c');
  });

  it('builds the textbook tree for (a|b)*abb#', () => {
    const tree = buildSyntaxTree(toPostfix('(a|b)*abb'), true);
    expect(tree.type).toBe('concat');
    expect(tree.right?.symbol).toBe(END_MARKER);
    // Left child is the tree for (a|b)*abb
    expect(tree.left?.type).toBe('concat');
  });

  it('assigns deterministic sequential node IDs', () => {
    const tree1 = buildSyntaxTree(toPostfix('(a|b)*abb'));
    const tree2 = buildSyntaxTree(toPostfix('(a|b)*abb'));
    expect(tree1).toEqual(tree2);
  });

  it('throws InternalCompilerError on malformed postfix with too few operands', () => {
    expect(() => buildSyntaxTree(['*'])).toThrowError(InternalCompilerError);
    expect(() => buildSyntaxTree(['a', '.'])).toThrowError(InternalCompilerError);
    expect(() => buildSyntaxTree(['a', '|'])).toThrowError(InternalCompilerError);
  });

  it('throws InternalCompilerError on unrecognised tokens', () => {
    expect(() => buildSyntaxTree(['INVALID'])).toThrowError(InternalCompilerError);
  });
});
