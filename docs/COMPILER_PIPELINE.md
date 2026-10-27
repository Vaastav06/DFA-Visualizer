# Direct construction pipeline

This application demonstrates the direct regular-expression-to-DFA construction described in the Dragon Book, Algorithm 3.36. The syntax tree is analyzed to derive DFA states and transitions directly.

## 1. Parse the regular expression

The compiler validates the supported grammar, tokenizes the expression, makes implicit concatenation explicit with `.`, converts the expression to postfix form, and builds its syntax tree.

For an input expression `r`, the tree is augmented as `(r)#`. The marker `#` is a new leaf that identifies the end of a match; it is not an input symbol.

## 2. Number the leaves

Assign each symbol leaf a unique position from left to right. The end-marker leaf receives a position as well. Internal nodes represent alternation, concatenation, or Kleene star.

## 3. Compute node properties

For each node `n`, compute:

- `nullable(n)`: whether its subtree can match the empty string.
- `firstpos(n)`: positions that can match the first symbol of a string from the subtree.
- `lastpos(n)`: positions that can match the last symbol of a string from the subtree.

For concatenation `c1 . c2`:

- `nullable(c1 . c2) = nullable(c1) and nullable(c2)`
- `firstpos(c1 . c2) = firstpos(c1) ∪ firstpos(c2)` when `c1` is nullable; otherwise `firstpos(c1)`.
- `lastpos(c1 . c2) = lastpos(c1) ∪ lastpos(c2)` when `c2` is nullable; otherwise `lastpos(c2)`.

For alternation `c1 | c2`, the node is nullable if either child is nullable, and its first/last sets are the unions of the child sets. For star `c1*`, the node is nullable and its first/last sets equal those of `c1`.

## 4. Compute followpos

`followpos(i)` contains the positions that may immediately follow leaf position `i` in a string matched by the expression.

Apply these rules throughout the tree:

1. For every concatenation node `c1 . c2`, add every position in `firstpos(c2)` to `followpos(i)` for each `i` in `lastpos(c1)`.
2. For every star node `c1*`, add every position in `firstpos(c1)` to `followpos(i)` for each `i` in `lastpos(c1)`.

## 5. Construct the DFA directly

Let `S0 = firstpos(root)`. Each DFA state is a canonical set of syntax-tree positions. For a state `S` and input symbol `a`, compute:

```text
U = union of followpos(i) for each i in S whose leaf symbol is a
```

If `U` is nonempty, it is the destination state for `a`; create it if it has not appeared before. If `U` is empty, the partial DFA has no transition for that symbol. The visualizer can optionally show that missing transition as an implicit sink for clarity; the sink is not part of the constructed DFA.

A DFA state is accepting exactly when its position set contains the end-marker position.

## Worked example: `(a|b)*abb`

The numbered leaves are `1:a, 2:b, 3:a, 4:b, 5:b, 6:#`.

```text
followpos(1) = {1, 2, 3}    followpos(2) = {1, 2, 3}
followpos(3) = {4}          followpos(4) = {5}
followpos(5) = {6}          followpos(6) = {}
```

The DFA starts at `{1, 2, 3}`. Reading `a` leads to `{1, 2, 3, 4}`; reading `b` from the start leads to `{1, 2, 3}`. A state containing position `6` is accepting. The simulator traces input through these same constructed states.

## Implementation map

- `src/compiler/validator.ts`, `tokenizer.ts`, `explicitConcatenation.ts`, `infixToPostfix.ts`: input preparation.
- `src/compiler/syntaxTree.ts`, `positions.ts`: augmented tree and leaf positions.
- `src/compiler/nullable.ts`, `firstpos.ts`, `lastpos.ts`, `followpos.ts`: syntax-tree analysis.
- `src/compiler/directDfa.ts`: position-set DFA construction.
- `src/compiler/simulator.ts`: DFA string simulation.
