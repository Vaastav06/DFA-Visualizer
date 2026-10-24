/**
 * Independent Algorithm Validation & Differential Language Testing.
 *
 * Uses an independent recursive derivative/Brzozowski/NFA-evaluator oracle
 * and JavaScript anchored RegExp oracle to validate the direct RE -> DFA
 * construction and Moore minimization across:
 *  - Deterministic reference cases
 *  - Randomized valid regex generation
 *  - Exhaustive and randomized string simulation
 *  - Differential comparison: Oracle vs Direct DFA vs Minimized DFA
 */

import { describe, expect, it } from 'vitest';
import { compileRegex, simulate, type SyntaxNode, MAX_REGEX_LENGTH } from '../../src/compiler';
import { allStringsUpTo, assertDenseIds, assertDfaInvariants } from './support/automata';

/**
 * Independent Oracle 1: Brzozowski Derivative Evaluator over the unaugmented AST.
 * Completely independent of position numbering, firstpos, lastpos, followpos,
 * and state subset construction.
 */
type RegexAst =
  | { kind: 'empty' }
  | { kind: 'eps' }
  | { kind: 'lit'; char: string }
  | { kind: 'union'; left: RegexAst; right: RegexAst }
  | { kind: 'concat'; left: RegexAst; right: RegexAst }
  | { kind: 'star'; child: RegexAst };

function fromSyntaxNode(node: SyntaxNode): RegexAst {
  switch (node.type) {
    case 'symbol':
      return { kind: 'lit', char: node.symbol ?? '' };
    case 'union':
      return {
        kind: 'union',
        left: fromSyntaxNode(node.left!),
        right: fromSyntaxNode(node.right!),
      };
    case 'concat':
      return {
        kind: 'concat',
        left: fromSyntaxNode(node.left!),
        right: fromSyntaxNode(node.right!),
      };
    case 'star':
      return {
        kind: 'star',
        child: fromSyntaxNode(node.left!),
      };
  }
}

function matchesEmpty(ast: RegexAst): boolean {
  switch (ast.kind) {
    case 'empty':
      return false;
    case 'eps':
      return true;
    case 'lit':
      return false;
    case 'union':
      return matchesEmpty(ast.left) || matchesEmpty(ast.right);
    case 'concat':
      return matchesEmpty(ast.left) && matchesEmpty(ast.right);
    case 'star':
      return true;
  }
}

function derive(ast: RegexAst, char: string): RegexAst {
  switch (ast.kind) {
    case 'empty':
    case 'eps':
      return { kind: 'empty' };
    case 'lit':
      return ast.char === char ? { kind: 'eps' } : { kind: 'empty' };
    case 'union':
      return {
        kind: 'union',
        left: derive(ast.left, char),
        right: derive(ast.right, char),
      };
    case 'concat': {
      const leftDeriv: RegexAst = {
        kind: 'concat',
        left: derive(ast.left, char),
        right: ast.right,
      };
      if (matchesEmpty(ast.left)) {
        return {
          kind: 'union',
          left: leftDeriv,
          right: derive(ast.right, char),
        };
      }
      return leftDeriv;
    }
    case 'star':
      return {
        kind: 'concat',
        left: derive(ast.child, char),
        right: ast,
      };
  }
}

function simplify(ast: RegexAst): RegexAst {
  switch (ast.kind) {
    case 'empty':
    case 'eps':
    case 'lit':
      return ast;
    case 'union': {
      const l = simplify(ast.left);
      const r = simplify(ast.right);
      if (l.kind === 'empty') return r;
      if (r.kind === 'empty') return l;
      return { kind: 'union', left: l, right: r };
    }
    case 'concat': {
      const l = simplify(ast.left);
      const r = simplify(ast.right);
      if (l.kind === 'empty' || r.kind === 'empty') return { kind: 'empty' };
      if (l.kind === 'eps') return r;
      if (r.kind === 'eps') return l;
      return { kind: 'concat', left: l, right: r };
    }
    case 'star': {
      const c = simplify(ast.child);
      if (c.kind === 'empty' || c.kind === 'eps') return { kind: 'eps' };
      return { kind: 'star', child: c };
    }
  }
}

function brzozowskiAccepts(unaugmentedRoot: SyntaxNode, input: string): boolean {
  let current = fromSyntaxNode(unaugmentedRoot);
  for (const ch of input) {
    current = simplify(derive(current, ch));
    if (current.kind === 'empty') return false;
  }
  return matchesEmpty(current);
}

/**
 * Independent Oracle 2: Anchored JS RegExp matcher (since the grammar only
 * uses literals, |, implicit concatenation, *, (), and whitespace).
 */
function jsRegexAccepts(regex: string, input: string): boolean {
  const stripped = regex.replace(/\s+/g, '');
  const re = new RegExp(`^(?:${stripped})$`);
  return re.test(input);
}

/**
 * Deterministic PRNG (Mulberry32) so randomized property tests are 100% reproducible.
 */
function createPrng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateRandomRegex(rand: () => number, depth: number, symbols: string[]): string {
  if (depth <= 0 || rand() < 0.35) {
    const sym = symbols[Math.floor(rand() * symbols.length)];
    return rand() < 0.25 ? `${sym}*` : sym;
  }

  const choice = rand();
  if (choice < 0.4) {
    // Concatenation
    const left = generateRandomRegex(rand, depth - 1, symbols);
    const right = generateRandomRegex(rand, depth - 1, symbols);
    return `${left}${right}`;
  } else if (choice < 0.8) {
    // Union
    const left = generateRandomRegex(rand, depth - 1, symbols);
    const right = generateRandomRegex(rand, depth - 1, symbols);
    return `(${left}|${right})`;
  } else {
    // Starred group
    const inner = generateRandomRegex(rand, depth - 1, symbols);
    // Avoid generating "**" if inner already ends with "*"
    if (inner.endsWith('*')) {
      return `(${inner})`;
    }
    return `(${inner})*`;
  }
}

describe('independent oracle differential testing', () => {
  const complexExpressions = [
    'a',
    'b',
    'ab',
    'a|b',
    'a*',
    '(a|b)*',
    '(a|b)*abb',
    'a(b|c)*',
    '(a|b)(c|d)',
    '(a*b*)*',
    '(a|b)*a(a|b)',
    '(a|b)*a(a|b)(a|b)',
    '((a|b)*c)*',
    '(ab|aba)*',
    '(a|ba)*b*',
    'a*(ba*ba*)*',
    '(0|1(01*0)*1)*',
    '(a|b|c)*abc',
    '((a*b)*|c*)*',
    'a*b*c*',
    '(aa|aaa)*',
  ];

  it.each(complexExpressions)(
    'matches both Brzozowski derivative oracle and JS RegExp oracle for %s',
    (regex) => {
      const result = compileRegex(regex);
      assertDfaInvariants(result.dfa);
      assertDenseIds(result.dfa);
      assertDfaInvariants(result.minimizedDfa);
      assertDenseIds(result.minimizedDfa);

      // Root is CONCAT(baseTree, #), so result.syntaxTree.left is the unaugmented tree
      const baseTree = result.syntaxTree.left!;
      const testAlphabet = [...new Set([...result.dfa.alphabet, 'z'])];
      const testStrings = allStringsUpTo(
        result.dfa.alphabet,
        result.dfa.alphabet.length <= 2 ? 6 : 4
      );
      // Add extra strings with out-of-alphabet characters
      for (const s of allStringsUpTo(testAlphabet, 2)) {
        testStrings.push(s);
      }

      for (const input of testStrings) {
        const expectedBrz = brzozowskiAccepts(baseTree, input);
        const expectedJs = jsRegexAccepts(regex, input);
        const dfaRes = simulate(result.dfa, input);
        const minDfaRes = simulate(result.minimizedDfa, input);

        expect(expectedBrz).toBe(expectedJs);
        expect({ regex, input, dfa: dfaRes.accepted }).toEqual({
          regex,
          input,
          dfa: expectedBrz,
        });
        expect({ regex, input, minDfa: minDfaRes.accepted }).toEqual({
          regex,
          input,
          minDfa: expectedBrz,
        });
      }
    }
  );

  it('passes 100 randomized property-based differential regex tests', () => {
    const rand = createPrng(20261024);
    const symbols = ['a', 'b', 'c'];

    for (let i = 0; i < 100; i += 1) {
      const regex = generateRandomRegex(rand, 3, symbols);
      const result = compileRegex(regex);

      assertDfaInvariants(result.dfa);
      assertDenseIds(result.dfa);
      assertDfaInvariants(result.minimizedDfa);
      assertDenseIds(result.minimizedDfa);

      const baseTree = result.syntaxTree.left!;
      const strings = allStringsUpTo(symbols, 5);

      for (const str of strings) {
        const oracle1 = brzozowskiAccepts(baseTree, str);
        const oracle2 = jsRegexAccepts(regex, str);
        const directActual = simulate(result.dfa, str).accepted;
        const minActual = simulate(result.minimizedDfa, str).accepted;

        expect(oracle1).toBe(oracle2);
        if (directActual !== oracle1 || minActual !== oracle1) {
          expect.fail(
            `Discrepancy on regex #${i} "${regex}" with input "${str}": oracle=${oracle1}, dfa=${directActual}, minDfa=${minActual}`
          );
        }
      }
    }
  });

  it('enforces MAX_REGEX_LENGTH safeguard cleanly without stack overflow', () => {
    const overlyLong = 'a'.repeat(MAX_REGEX_LENGTH + 1);
    expect(() => compileRegex(overlyLong)).toThrow(/too long/i);

    const maxAllowed = 'a'.repeat(50);
    const res = compileRegex(maxAllowed);
    expect(simulate(res.minimizedDfa, maxAllowed).accepted).toBe(true);
    expect(simulate(res.minimizedDfa, 'a'.repeat(49)).accepted).toBe(false);
  });
});
