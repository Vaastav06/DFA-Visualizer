# Direct Regular Expression to DFA Visualizer

An interactive teaching tool for the **direct regular-expression-to-DFA construction** from the Dragon Book (Algorithm 3.36). Enter a supported regular expression to inspect its syntax tree, position analysis, `followpos` table, directly constructed DFA, and a trace of an input string.

The compiler constructs the DFA directly from syntax-tree leaf positions. It does not build an intermediate automaton.

## Walkthrough

The default example `(a|b)*abb` passes through these stages:

1. Validate and tokenize the expression.
2. Insert explicit concatenation operators and convert to postfix notation.
3. Build the syntax tree for the augmented expression `(r)#` and number its leaves from left to right.
4. Compute `nullable`, `firstpos`, and `lastpos` for each syntax-tree node.
5. Compute `followpos` for every leaf position.
6. Construct DFA states as sets of positions, starting with `firstpos(root)`. Transitions use the `followpos` sets of positions carrying the input symbol. A state is accepting when it contains the position of `#`.
7. Inspect the constructed DFA and simulate strings through it.

The method and worked example are described in [docs/COMPILER_PIPELINE.md](docs/COMPILER_PIPELINE.md). Supported input syntax is listed in [docs/REGEX_SPECIFICATION.md](docs/REGEX_SPECIFICATION.md).

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To check the project:

```bash
npm test
npm run typecheck
npm run build
```

## Project layout

- `src/compiler/` implements the direct construction stages and DFA simulator.
- `src/visualization/` renders the augmented syntax tree and DFA position sets.
- `src/components/` and `src/pages/` provide the interactive walkthrough.
- `tests/` covers compiler stages, DFA behavior, and visual components.
