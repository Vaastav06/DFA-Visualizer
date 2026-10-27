/**
 * Stage 5a - Syntax Tree Construction & Augmentation.
 *
 * CONTRACT: constructs an explicit abstract syntax tree from postfix tokens,
 * augmented with the unique end-marker `#`:
 *   CONCAT(r, #)
 *
 * Each leaf node represents a literal symbol or the end-marker `#`.
 * Internal nodes represent unary ('star') or binary ('concat', 'union') operations.
 * Node IDs are positive integers assigned deterministically in creation order.
 */

import { InternalCompilerError } from './errors';
import { isLiteral } from './tokenizer';
import type { SyntaxNode } from './types';

/** The unique internal end-marker symbol. */
export const END_MARKER = '#';

/**
 * Constructs a syntax tree from postfix tokens.
 * By default, augments the tree by concatenating the end-marker `#` at the root.
 *
 * @param postfix Postfix token sequence from `infixToPostfix`.
 * @param augment Whether to augment with the end-marker `#` (default true).
 * @returns The root syntax node.
 */
export function buildSyntaxTree(postfix: string[], augment = true): SyntaxNode {
  let nextId = 1;
  const stack: SyntaxNode[] = [];

  const popNode = (op: string): SyntaxNode => {
    const node = stack.pop();
    if (node === undefined) {
      throw new InternalCompilerError(
        'The syntax tree could not be constructed.',
        `Operator ${JSON.stringify(op)} has too few operands on the stack.`
      );
    }
    return node;
  };

  for (const token of postfix) {
    if (isLiteral(token) || token === END_MARKER) {
      stack.push({
        id: nextId++,
        type: 'symbol',
        symbol: token,
        nullable: false,
        firstpos: [],
        lastpos: [],
      });
      continue;
    }

    switch (token) {
      case '*': {
        const child = popNode('*');
        stack.push({
          id: nextId++,
          type: 'star',
          left: child,
          nullable: true,
          firstpos: [],
          lastpos: [],
        });
        break;
      }

      case '|': {
        const right = popNode('|');
        const left = popNode('|');
        stack.push({
          id: nextId++,
          type: 'union',
          left,
          right,
          nullable: false,
          firstpos: [],
          lastpos: [],
        });
        break;
      }

      case '.': {
        const right = popNode('.');
        const left = popNode('.');
        stack.push({
          id: nextId++,
          type: 'concat',
          left,
          right,
          nullable: false,
          firstpos: [],
          lastpos: [],
        });
        break;
      }

      default:
        throw new InternalCompilerError(
          'The syntax tree could not be constructed.',
          `Unrecognised token ${JSON.stringify(token)} in postfix expression.`
        );
    }
  }

  if (stack.length !== 1) {
    throw new InternalCompilerError(
      'The syntax tree could not be constructed.',
      `Expected exactly 1 node on the stack, found ${stack.length}.`
    );
  }

  const baseTree = stack[0];
  if (!augment) {
    return baseTree;
  }

  // Augment with end-marker: CONCAT(baseTree, #)
  const endMarkerNode: SyntaxNode = {
    id: nextId++,
    type: 'symbol',
    symbol: END_MARKER,
    nullable: false,
    firstpos: [],
    lastpos: [],
  };

  return {
    id: nextId++,
    type: 'concat',
    left: baseTree,
    right: endMarkerNode,
    nullable: false,
    firstpos: [],
    lastpos: [],
  };
}
