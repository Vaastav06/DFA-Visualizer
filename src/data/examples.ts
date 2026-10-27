/**
 * Example regular expressions offered in the UI.
 *
 *
 * These are INPUTS only. Never store their compiled output here — that is the
 * compiler's job; example inputs stay separate from compiler output.
 * Test expectations belong in tests/compiler/.
 *
 * Every example must be valid under docs/REGEX_SPECIFICATION.md.
 */

export interface RegexExample {
  /** The expression to load into the input field. */
  expression: string;
  /** One short line explaining what the expression matches. */
  description: string;
}

export const EXAMPLE_EXPRESSIONS: readonly RegexExample[] = [
  { expression: 'a', description: 'A single literal symbol.' },
  { expression: 'a|b', description: 'Alternation: either a or b.' },
  { expression: 'ab', description: 'Implicit concatenation: a followed by b.' },
  { expression: 'a*', description: 'Kleene star: zero or more a.' },
  { expression: '(a|b)*', description: 'Any string over the alphabet {a, b}, including empty.' },
  {
    expression: '(a|b)*abb',
    description: 'The textbook example: any string over {a, b} ending in abb.',
  },
  { expression: 'a(b|c)*', description: 'An a followed by any number of b or c.' },
  { expression: '(a|b)(c|d)', description: 'One of a, b followed by one of c, d.' },
];

/** Convenience default shown before the user types anything. */
export const DEFAULT_EXAMPLE = '(a|b)*abb';
