/** Stage 9 - DFA string simulation. */

import { describe, expect, it } from 'vitest';
import { simulate } from '../../src/compiler/simulator';
import { compileRegex } from '../../src/compiler/compiler';
import type { DFA } from '../../src/compiler/types';

function buildDfa(regex: string): DFA {
  return compileRegex(regex).dfa;
}

describe('acceptance', () => {
  const cases: [string, string[], string[]][] = [
    ['a', ['a'], ['', 'b', 'aa']],
    ['a|b', ['a', 'b'], ['', 'ab', 'c']],
    ['ab', ['ab'], ['', 'a', 'b', 'abb']],
    ['a*', ['', 'a', 'aa', 'aaaaa'], ['b', 'ab']],
    ['(a|b)*', ['', 'a', 'b', 'abba'], ['c', 'abc']],
    ['(a|b)*abb', ['abb', 'aabb', 'babb', 'ababb'], ['', 'a', 'ab', 'abba']],
    ['a(b|c)*', ['a', 'ab', 'ac', 'abcb'], ['', 'b', 'ba']],
    ['(a|b)(c|d)', ['ac', 'ad', 'bc', 'bd'], ['', 'a', 'ab', 'acc']],
  ];

  it.each(cases)('%s accepts the right strings', (regex, accepted) => {
    const dfa = buildDfa(regex);
    for (const input of accepted) {
      expect({ input, accepted: simulate(dfa, input).accepted }).toEqual({ input, accepted: true });
    }
  });

  it.each(cases)('%s rejects the right strings', (regex, _accepted, rejected) => {
    const dfa = buildDfa(regex);
    for (const input of rejected) {
      expect({ input, accepted: simulate(dfa, input).accepted }).toEqual({
        input,
        accepted: false,
      });
    }
  });
});

describe('the empty string', () => {
  it('is accepted when the start state accepts', () => {
    const result = simulate(buildDfa('a*'), '');
    expect(result.accepted).toBe(true);
    expect(result.steps).toEqual([]);
    expect(result.path).toEqual([0]);
  });

  it('is rejected when the start state does not accept', () => {
    const result = simulate(buildDfa('a'), '');
    expect(result.accepted).toBe(false);
    expect(result.rejectedAt).toBeUndefined();
  });

  it('is never treated as an error', () => {
    expect(() => simulate(buildDfa('ab'), '')).not.toThrow();
  });
});

describe('the trace', () => {
  it('starts the path at the DFA start state', () => {
    for (const regex of ['a', 'ab', '(a|b)*abb']) {
      const dfa = buildDfa(regex);
      expect(simulate(dfa, 'ab').path[0]).toBe(dfa.startState);
    }
  });

  it('records one step per consumed character', () => {
    const result = simulate(buildDfa('(a|b)*abb'), 'aabb');
    expect(result.steps).toHaveLength(4);
    expect(result.steps.map((step) => step.symbol)).toEqual(['a', 'a', 'b', 'b']);
    expect(result.steps.map((step) => step.index)).toEqual([0, 1, 2, 3]);
  });

  it('chains each step from the previous state', () => {
    const result = simulate(buildDfa('(a|b)*abb'), 'abb');
    for (let i = 1; i < result.steps.length; i += 1) {
      expect(result.steps[i].fromState).toBe(result.steps[i - 1].toState);
    }
  });

  it('keeps the path one longer than the steps on a full run', () => {
    const result = simulate(buildDfa('(a|b)*abb'), 'abb');
    expect(result.path).toHaveLength(result.steps.length + 1);
  });

  it('echoes the input back', () => {
    expect(simulate(buildDfa('a*'), 'aaa').input).toBe('aaa');
  });
});

describe('early rejection', () => {
  it('stops at a symbol with no transition and records where', () => {
    const result = simulate(buildDfa('ab'), 'aab');
    expect(result.accepted).toBe(false);
    expect(result.rejectedAt).toBe(1);
    expect(result.steps[result.steps.length - 1].toState).toBeNull();
  });

  it('stops at a symbol outside the alphabet', () => {
    const result = simulate(buildDfa('(a|b)*'), 'abzab');
    expect(result.accepted).toBe(false);
    expect(result.rejectedAt).toBe(2);
    expect(result.steps).toHaveLength(3);
    expect(result.steps[2].symbol).toBe('z');
    expect(result.steps[2].toState).toBeNull();
  });

  it('rejects an unknown symbol as the very first character', () => {
    const result = simulate(buildDfa('a*'), 'z');
    expect(result.accepted).toBe(false);
    expect(result.rejectedAt).toBe(0);
    expect(result.path).toEqual([0]);
  });

  it('never throws for a rejected string - rejection is a result', () => {
    expect(() => simulate(buildDfa('ab'), 'zzz')).not.toThrow();
  });

  it('leaves rejectedAt undefined when the whole input was consumed', () => {
    expect(simulate(buildDfa('ab'), 'ab').rejectedAt).toBeUndefined();
    expect(simulate(buildDfa('ab'), 'a').rejectedAt).toBeUndefined();
  });
});

describe('longer inputs', () => {
  it('handles a long repeated string', () => {
    const dfa = buildDfa('(a|b)*abb');
    const input = 'ab'.repeat(200) + 'abb';
    const result = simulate(dfa, input);
    expect(result.accepted).toBe(true);
    expect(result.steps).toHaveLength(input.length);
  });
});
