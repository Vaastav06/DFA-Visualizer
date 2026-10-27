# Demonstration guide

Use `(a|b)*abb` to show how the visualizer turns a regular expression into a DFA using the direct position-set method.

1. Enter the expression and compile it.
2. Show explicit concatenation and postfix notation to explain how the expression becomes a syntax tree.
3. Inspect the augmented tree and leaf positions. Point out the end-marker `#`.
4. Review `nullable`, `firstpos`, and `lastpos`, then inspect the `followpos` table.
5. Open **Direct DFA Construction**. Explain that each state is a set of syntax-tree positions, the start state is `firstpos(root)`, transitions are unions of `followpos`, and a state accepts when it contains the `#` position.
6. Run `abb` and observe acceptance. Run `ab` and observe rejection.

The supported grammar and algorithm details are in [REGEX_SPECIFICATION.md](REGEX_SPECIFICATION.md) and [COMPILER_PIPELINE.md](COMPILER_PIPELINE.md).
