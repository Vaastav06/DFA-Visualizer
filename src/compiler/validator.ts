/**
 * Stage 1 - Validation.
 *
 * CONTRACT: accepts the raw user string, throws a `RegexSyntaxError` describing
 * the first problem found, or returns normally when the expression is well
 * formed. Must never return a partially-checked "maybe ok".
 *
 * Checks required by docs/REGEX_SPECIFICATION.md:
 *  - empty / whitespace-only input          -> EMPTY_INPUT
 *  - characters outside the supported set   -> INVALID_CHARACTER
 *  - unbalanced parentheses                 -> UNBALANCED_PARENTHESES
 *  - "()"                                   -> EMPTY_GROUP
 *  - leading "*" or "|", trailing "|"       -> INVALID_OPERATOR_POSITION
 *  - "**", "|*", "(|", "|)"                 -> DANGLING_OPERATOR
 *
 * Every later stage assumes its input passed this function. That assumption is
 * what lets stages 2-8 stay short: they do not each re-check the syntax.
 */

import { RegexSyntaxError } from './errors';

/** Characters the grammar reserves; none of them can be a literal. */
const RESERVED = new Set(['|', '*', '(', ')', '.']);

/**
 * Maximum input length accepted by the validator to prevent call-stack
 * exhaustion and excessive compilation latency on pathological inputs.
 */
export const MAX_REGEX_LENGTH = 500;

/** One non-whitespace character together with its index in the original input. */
interface PositionedChar {
  char: string;
  index: number;
}

/** True for characters the tokenizer is allowed to drop. */
function isWhitespace(char: string): boolean {
  return /\s/.test(char);
}

/**
 * A literal is any single character that is neither reserved nor whitespace.
 * The grammar restricts literals to letters and digits so that a stray symbol
 * is reported rather than silently becoming part of the alphabet.
 */
function isLiteralChar(char: string): boolean {
  return /[A-Za-z0-9]/.test(char);
}

/** Throws a `RegexSyntaxError` if `regex` is not a valid expression. */
export function validate(regex: string): void {
  if (regex.length > MAX_REGEX_LENGTH) {
    throw new RegexSyntaxError(
      'INVALID_OPERATOR_POSITION',
      `The regular expression is too long (${regex.length} characters). Keep expressions to ${MAX_REGEX_LENGTH} characters or fewer.`,
      {
        position: MAX_REGEX_LENGTH,
        details: `Input length ${regex.length} exceeds MAX_REGEX_LENGTH (${MAX_REGEX_LENGTH}).`,
      }
    );
  }

  const chars = collectSignificantChars(regex);

  if (chars.length === 0) {
    throw new RegexSyntaxError('EMPTY_INPUT', 'Enter a regular expression to get started.', {
      details: `Input was ${JSON.stringify(regex)}.`,
    });
  }

  checkFirstToken(chars[0]);
  checkStructure(chars);
  checkLastToken(chars[chars.length - 1]);
}

/**
 * Drops whitespace and rejects unsupported characters, keeping each surviving
 * character's index in the ORIGINAL string so error positions stay meaningful.
 */
function collectSignificantChars(regex: string): PositionedChar[] {
  const chars: PositionedChar[] = [];

  for (let index = 0; index < regex.length; index += 1) {
    const char = regex[index];

    if (isWhitespace(char)) {
      continue;
    }

    if (!RESERVED.has(char) && !isLiteralChar(char)) {
      throw new RegexSyntaxError(
        'INVALID_CHARACTER',
        `The character "${char}" is not supported. Use letters, digits, and the operators |, *, ( and ).`,
        { position: index, details: `Unsupported character at index ${index}.` }
      );
    }

    if (char === '.') {
      // "." is the internal explicit-concatenation operator, so it cannot also
      // be a literal the user types. See docs/REGEX_SPECIFICATION.md.
      throw new RegexSyntaxError(
        'INVALID_CHARACTER',
        'The character "." is reserved for concatenation and cannot be used as a symbol. Write "ab" instead of "a.b".',
        { position: index, details: `Reserved concatenation operator at index ${index}.` }
      );
    }

    chars.push({ char, index });
  }

  return chars;
}

/** An expression may only begin with a literal or an opening parenthesis. */
function checkFirstToken(first: PositionedChar): void {
  if (first.char === '*' || first.char === '|') {
    throw new RegexSyntaxError(
      'INVALID_OPERATOR_POSITION',
      `An expression cannot start with "${first.char}". Put a symbol before it.`,
      { position: first.index, details: `Leading operator at index ${first.index}.` }
    );
  }
}

/** An expression may only end with a literal, a star or a closing parenthesis. */
function checkLastToken(last: PositionedChar): void {
  if (last.char === '|') {
    throw new RegexSyntaxError(
      'INVALID_OPERATOR_POSITION',
      'An expression cannot end with "|". Put a symbol after it.',
      { position: last.index, details: `Trailing operator at index ${last.index}.` }
    );
  }
}

/**
 * Single left-to-right pass checking parenthesis balance and the legality of
 * every adjacent pair. Adjacency is checked before the depth rule for the same
 * character, so "(a|)" reports the dangling "|" rather than the parenthesis.
 */
function checkStructure(chars: PositionedChar[]): void {
  // Indices of "(" whose ")" has not been seen yet, so an unmatched opener can
  // be reported at its own position rather than at the end of the string.
  const openParens: number[] = [];

  for (let i = 0; i < chars.length; i += 1) {
    const current = chars[i];
    const previous = i > 0 ? chars[i - 1] : null;

    if (previous !== null) {
      checkAdjacency(previous, current);
    }

    if (current.char === '(') {
      openParens.push(current.index);
    } else if (current.char === ')') {
      if (openParens.length === 0) {
        throw new RegexSyntaxError(
          'UNBALANCED_PARENTHESES',
          `There is a closing parenthesis without a matching opening one, at position ${current.index + 1}.`,
          { position: current.index, details: `Unmatched ")" at index ${current.index}.` }
        );
      }
      openParens.pop();
    }
  }

  if (openParens.length > 0) {
    const position = openParens[openParens.length - 1];
    throw new RegexSyntaxError(
      'UNBALANCED_PARENTHESES',
      `There is an opening parenthesis without a matching closing one, at position ${position + 1}.`,
      { position, details: `Unmatched "(" at index ${position}.` }
    );
  }
}

/**
 * Rejects the adjacent pairs the grammar does not allow.
 *
 * After "|" or "(" the grammar needs an operand, so only a literal or "(" may
 * follow. After a literal, ")" or "*" any of "|", "*", "(", ")" or a literal is
 * fine - concatenation is implicit, which is exactly what stage 3 makes
 * explicit.
 */
function checkAdjacency(previous: PositionedChar, current: PositionedChar): void {
  const needsOperand = previous.char === '|' || previous.char === '(';

  if (!needsOperand) {
    if (current.char === '*' && previous.char === '*') {
      throw new RegexSyntaxError(
        'DANGLING_OPERATOR',
        `Two "*" operators appear in a row, at position ${current.index + 1}. Remove one of them.`,
        { position: current.index, details: `"**" at index ${current.index}.` }
      );
    }
    return;
  }

  if (current.char === ')' && previous.char === '(') {
    throw new RegexSyntaxError(
      'EMPTY_GROUP',
      `Empty groups are not allowed. Put an expression inside the parentheses at position ${previous.index + 1}.`,
      { position: previous.index, details: `"()" at index ${previous.index}.` }
    );
  }

  if (current.char === '*') {
    // "(*" or "|*": the star has nothing to repeat.
    throw new RegexSyntaxError(
      previous.char === '(' ? 'INVALID_OPERATOR_POSITION' : 'DANGLING_OPERATOR',
      `"*" at position ${current.index + 1} has nothing to repeat. Put a symbol before it.`,
      {
        position: current.index,
        details: `"${previous.char}*" at index ${current.index}.`,
      }
    );
  }

  if (current.char === '|' || current.char === ')') {
    throw new RegexSyntaxError(
      'DANGLING_OPERATOR',
      `"${previous.char}" at position ${previous.index + 1} is missing the expression that should follow it.`,
      {
        position: current.index,
        details: `"${previous.char}${current.char}" at index ${previous.index}.`,
      }
    );
  }
}
