/**
 * The whole pipeline through the public API.
 *
 * The centrepiece is the language-equivalence suite: for every example
 * expression, the NFA, the DFA and the minimized DFA must agree on every
 * string up to length 4. That single property catches subset-construction and
 * minimization bugs that structural assertions miss.
 */

import { describe, expect, it } from 'vitest';
import { compileRegex, simulate, isCompilerError, PIPELINE_STEPS } from '../../src/compiler';
import {
  allStringsUpTo,
  assertDfaInvariants,
  dfaAccepts,
} from './support/automata';

const EXPRESSIONS = ['a', 'a|b', 'ab', 'a*', '(a|b)*', '(a|b)*abb', 'a(b|c)*', '(a|b)(c|d)'];

describe('the shape of a CompilationResult', () => {
  it.each(EXPRESSIONS)('%s produces every documented field', (regex) => {
    const result = compileRegex(regex);

    expect(result.input).toBe(regex);
    expect(result.tokens.length).toBeGreaterThan(0);
    expect(typeof result.explicitConcatenation).toBe('string');
    expect(typeof result.postfix).toBe('string');
    expect(result.syntaxTree).toBeDefined();
    expect(result.positions.length).toBeGreaterThan(0);
    expect(result.analysis).toBeDefined();
    expect(result.followpos.length).toBeGreaterThan(0);
    expect(result.dfa.states.length).toBeGreaterThan(0);
    expect(result.minimizedDfa.states.length).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it.each(EXPRESSIONS)('%s produces well-formed automata', (regex) => {
    const result = compileRegex(regex);
    expect(() => assertDfaInvariants(result.dfa)).not.toThrow();
    expect(() => assertDfaInvariants(result.minimizedDfa)).not.toThrow();
  });

  it('echoes the input exactly as typed, including whitespace', () => {
    expect(compileRegex(' a | b ').input).toBe(' a | b ');
  });

  it('reports the stage outputs for (a|b)*abb', () => {
    const result = compileRegex('(a|b)*abb');
    expect(result.tokens).toEqual(['(', 'a', '|', 'b', ')', '*', 'a', 'b', 'b']);
    expect(result.explicitConcatenation).toBe('(a|b)*.a.b.b');
    expect(result.postfix).toBe('ab|*a.b.b.');
    expect(result.positions).toHaveLength(6);
    expect(result.followpos).toHaveLength(6);
    expect(result.dfa.states).toHaveLength(4);
    expect(result.minimizedDfa.states).toHaveLength(4);
  });
});

describe('the compilation steps', () => {
  it('returns one step per pipeline stage, with the canonical ids in order', () => {
    const result = compileRegex('(a|b)*abb');
    expect(result.steps.map((step) => step.id)).toEqual(PIPELINE_STEPS.map((step) => step.id));
  });

  it('describes what actually happened to this expression', () => {
    const result = compileRegex('(a|b)*abb');
    const byId = new Map(result.steps.map((step) => [step.id, step.description]));

    expect(byId.get('input')).toContain('a, b');
    expect(byId.get('tokens')).toContain('9 tokens');
    expect(byId.get('postfix')).toContain('ab|*a.b.b.');
    expect(byId.get('minimized')).toContain('4 states');
  });

  it('adapts the description when nothing was inserted', () => {
    const result = compileRegex('a|b');
    const concatenation = result.steps.find((step) => step.id === 'concatenation');
    expect(concatenation?.description).toContain('No concatenation was implied');
  });

  it('gives every step a non-empty title and description', () => {
    for (const step of compileRegex('a*').steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    }
  });
});

describe('language equivalence between direct DFA and minimized DFA', () => {
  it.each(EXPRESSIONS)('%s: DFA and minimized DFA agree on every string', (regex) => {
    const { dfa, minimizedDfa } = compileRegex(regex);

    for (const input of allStringsUpTo(dfa.alphabet, 4)) {
      expect(dfaAccepts(minimizedDfa, input)).toBe(dfaAccepts(dfa, input));
    }
  });

  it('agrees on strings containing symbols outside the alphabet', () => {
    const { dfa, minimizedDfa } = compileRegex('(a|b)*');
    for (const input of ['z', 'az', 'abz', 'zab']) {
      expect(dfaAccepts(dfa, input)).toBe(false);
      expect(dfaAccepts(minimizedDfa, input)).toBe(false);
    }
  });
});

describe('the languages the examples describe', () => {
  const cases: [string, string[], string[]][] = [
    ['a', ['a'], ['', 'b', 'aa']],
    ['a|b', ['a', 'b'], ['', 'c', 'ab']],
    ['ab', ['ab'], ['', 'a', 'b', 'ba', 'abb']],
    ['a*', ['', 'a', 'aa', 'aaaaaa'], ['b', 'ab', 'ba']],
    ['(a|b)*', ['', 'a', 'b', 'abba', 'bbbb'], ['c', 'abc']],
    ['(a|b)*abb', ['abb', 'aabb', 'babb', 'abbabb', 'bbabb'], ['', 'a', 'ab', 'abba', 'bb']],
    ['a(b|c)*', ['a', 'ab', 'ac', 'abcbc'], ['', 'b', 'c', 'ba', 'abca']],
    ['(a|b)(c|d)', ['ac', 'ad', 'bc', 'bd'], ['', 'a', 'c', 'ab', 'acd', 'aac']],
  ];

  it.each(cases)('%s accepts the right strings', (regex, accepted) => {
    const { minimizedDfa } = compileRegex(regex);
    for (const input of accepted) {
      expect({ input, accepted: simulate(minimizedDfa, input).accepted }).toEqual({
        input,
        accepted: true,
      });
    }
  });

  it.each(cases)('%s rejects the right strings', (regex, _accepted, rejected) => {
    const { minimizedDfa } = compileRegex(regex);
    for (const input of rejected) {
      expect({ input, accepted: simulate(minimizedDfa, input).accepted }).toEqual({
        input,
        accepted: false,
      });
    }
  });
});

describe('errors', () => {
  const invalid: [string, string][] = [
    ['', 'EMPTY_INPUT'],
    ['   ', 'EMPTY_INPUT'],
    ['a#b', 'INVALID_CHARACTER'],
    ['a.b', 'INVALID_CHARACTER'],
    ['(a', 'UNBALANCED_PARENTHESES'],
    ['a)', 'UNBALANCED_PARENTHESES'],
    ['()', 'EMPTY_GROUP'],
    ['*a', 'INVALID_OPERATOR_POSITION'],
    ['|a', 'INVALID_OPERATOR_POSITION'],
    ['a|', 'INVALID_OPERATOR_POSITION'],
    ['a**', 'DANGLING_OPERATOR'],
    ['a||b', 'DANGLING_OPERATOR'],
  ];

  it.each(invalid)('rejects %j with code %s', (regex, code) => {
    try {
      compileRegex(regex);
      expect.unreachable('compileRegex should have thrown');
    } catch (error) {
      expect(isCompilerError(error)).toBe(true);
      expect(isCompilerError(error) && error.code).toBe(code);
    }
  });

  it('throws only CompilerError, so callers need one catch shape', () => {
    for (const [regex] of invalid) {
      expect(() => compileRegex(regex)).toThrowError(
        expect.objectContaining({ name: expect.stringMatching(/Error$/) })
      );
      try {
        compileRegex(regex);
      } catch (error) {
        expect(isCompilerError(error)).toBe(true);
      }
    }
  });

  it('gives a user-facing message with no file names or stack frames', () => {
    try {
      compileRegex('(a|b');
      expect.unreachable('compileRegex should have thrown');
    } catch (error) {
      expect(isCompilerError(error)).toBe(true);
      const message = (error as Error).message;
      for (const leak of ['.ts', 'src/', 'Error:', 'undefined', 'TODO']) {
        expect(message).not.toContain(leak);
      }
      expect(message.length).toBeGreaterThan(10);
      // The developer detail lives on the error object, not in the message.
      expect((error as { details?: string }).details).toBeDefined();
    }
  });
});

describe('textbook verification for (a|b)*abb#', () => {
  it('verifies all 9 components of direct construction on (a|b)*abb#', () => {
    const res = compileRegex('(a|b)*abb');

    // 1. Syntax tree
    expect(res.syntaxTree.type).toBe('concat');
    expect(res.syntaxTree.right?.symbol).toBe('#');

    // 2. Position numbering
    expect(res.positions).toEqual([
      { position: 1, symbol: 'a' },
      { position: 2, symbol: 'b' },
      { position: 3, symbol: 'a' },
      { position: 4, symbol: 'b' },
      { position: 5, symbol: 'b' },
      { position: 6, symbol: '#' },
    ]);

    // 3. Nullable
    expect(res.analysis.nullable).toBe(false);

    // 4. Firstpos
    expect(res.analysis.firstpos).toEqual([1, 2, 3]);

    // 5. Lastpos
    expect(res.analysis.lastpos).toEqual([6]);

    // 6. Followpos
    expect(res.followpos).toEqual([
      { position: 1, symbol: 'a', followpos: [1, 2, 3] },
      { position: 2, symbol: 'b', followpos: [1, 2, 3] },
      { position: 3, symbol: 'a', followpos: [4] },
      { position: 4, symbol: 'b', followpos: [5] },
      { position: 5, symbol: 'b', followpos: [6] },
      { position: 6, symbol: '#', followpos: [] },
    ]);

    // 7. Initial DFA state
    expect(res.dfa.startState).toBe(0);
    expect(res.dfa.states[0].positions).toEqual([1, 2, 3]);

    // 8. DFA transitions
    const transitions = res.dfa.transitions.map((t) => `${t.from}-${t.symbol}->${t.to}`).sort();
    expect(transitions).toEqual([
      '0-a->1',
      '0-b->0',
      '1-a->1',
      '1-b->2',
      '2-a->1',
      '2-b->3',
      '3-a->1',
      '3-b->0',
    ]);

    // 9. Accepting states
    expect(res.dfa.acceptStates).toEqual([3]);
    expect(res.dfa.states[3].positions).toContain(6);
    expect(res.dfa.states[3].isAccepting).toBe(true);
  });
});

describe('explicit required strings language equivalence', () => {
  const explicitTestCases = [
    {
      regex: '(a|b)*abb',
      strings: ['abb', 'aabb', 'babb', 'ab', 'a', ''],
    },
    {
      regex: 'a*',
      strings: ['', 'a', 'aa', 'b'],
    },
    {
      regex: '(a|b)*',
      strings: ['', 'a', 'b', 'ab', 'ba'],
    },
    {
      regex: 'a(b|c)*',
      strings: ['a', 'ab', 'ac', 'abc', 'b'],
    },
    {
      regex: '(a|b)(c|d)',
      strings: ['ac', 'ad', 'bc', 'bd', 'a', 'c'],
    },
  ];

  it.each(explicitTestCases)('$regex: direct DFA and minimized DFA have identical acceptance on required strings', ({ regex, strings }) => {
    const { dfa, minimizedDfa } = compileRegex(regex);
    for (const str of strings) {
      const directVerdict = simulate(dfa, str).accepted;
      const minVerdict = simulate(minimizedDfa, str).accepted;
      expect({ str, minVerdict }).toEqual({ str, minVerdict: directVerdict });
    }
  });
});

describe('determinism', () => {
  it.each(EXPRESSIONS)('%s compiles identically every time (deep equality and JSON stringify)', (regex) => {
    const run1 = compileRegex(regex);
    const run2 = compileRegex(regex);
    expect(run1).toEqual(run2);
    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
  });

  it('does not depend on what was compiled before', () => {
    const first = compileRegex('(a|b)*abb');
    compileRegex('a(b|c)*');
    compileRegex('(a|b)(c|d)');
    expect(compileRegex('(a|b)*abb')).toEqual(first);
    expect(JSON.stringify(compileRegex('(a|b)*abb'))).toBe(JSON.stringify(first));
  });
});

describe('robustness', () => {
  it('handles deeply nested parentheses', () => {
    const result = compileRegex('((((a|b))))');
    expect(result.minimizedDfa.states.length).toBeGreaterThan(0);
    expect(simulate(result.minimizedDfa, 'a').accepted).toBe(true);
  });

  it('handles a long expression', () => {
    const regex = '(a|b)*'.repeat(6);
    const result = compileRegex(regex);
    expect(simulate(result.minimizedDfa, 'abababab').accepted).toBe(true);
  });

  it('handles stacked stars on groups', () => {
    const result = compileRegex('((a*)*)*');
    expect(simulate(result.minimizedDfa, '').accepted).toBe(true);
    expect(simulate(result.minimizedDfa, 'aaa').accepted).toBe(true);
    expect(simulate(result.minimizedDfa, 'b').accepted).toBe(false);
  });

  it('handles digits as literals', () => {
    const result = compileRegex('(0|1)*1');
    expect(simulate(result.minimizedDfa, '0101').accepted).toBe(true);
    expect(simulate(result.minimizedDfa, '0100').accepted).toBe(false);
  });
});
