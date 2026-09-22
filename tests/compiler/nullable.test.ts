import { describe, expect, it } from 'vitest';
import { buildSyntaxTree } from '../../src/compiler/syntaxTree';
import { calculateNullable } from '../../src/compiler/nullable';
import { infixToPostfix } from '../../src/compiler/infixToPostfix';
import { insertExplicitConcatenation } from '../../src/compiler/explicitConcatenation';
import { tokenize } from '../../src/compiler/tokenizer';

function getRawTree(regex: string) {
  const postfix = infixToPostfix(insertExplicitConcatenation(tokenize(regex)));
  return buildSyntaxTree(postfix, false);
}

describe('nullable calculation', () => {
  it('symbol is not nullable', () => {
    const tree = getRawTree('a');
    expect(calculateNullable(tree)).toBe(false);
  });

  it('star of symbol is nullable', () => {
    const tree = getRawTree('a*');
    expect(calculateNullable(tree)).toBe(true);
  });

  it('star of complex subexpression is nullable', () => {
    expect(calculateNullable(getRawTree('(a|b)*'))).toBe(true);
    expect(calculateNullable(getRawTree('(ab)*'))).toBe(true);
  });

  it('union is nullable iff at least one operand is nullable', () => {
    expect(calculateNullable(getRawTree('a|b'))).toBe(false);
    expect(calculateNullable(getRawTree('a*|b'))).toBe(true);
    expect(calculateNullable(getRawTree('a|b*'))).toBe(true);
    expect(calculateNullable(getRawTree('a*|b*'))).toBe(true);
  });

  it('concat is nullable iff both operands are nullable', () => {
    expect(calculateNullable(getRawTree('ab'))).toBe(false);
    expect(calculateNullable(getRawTree('a*b'))).toBe(false);
    expect(calculateNullable(getRawTree('ab*'))).toBe(false);
    expect(calculateNullable(getRawTree('a*b*'))).toBe(true);
  });

  it('augmented tree with # is never nullable at root', () => {
    const postfix = infixToPostfix(insertExplicitConcatenation(tokenize('a*')));
    const augmented = buildSyntaxTree(postfix, true);
    expect(calculateNullable(augmented)).toBe(false);
  });
});
