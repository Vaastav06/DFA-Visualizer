# UI / UX Specification

Owner: Person 3. `src/components/`, `src/pages/`, `src/hooks/`, `src/context/`,
`src/styles/`, `src/data/`.

## The flow

```text
        user enters a regular expression
        (typed, or chosen from the examples)
                      │
                      ▼
                  [ Convert ]
                      │
                      ▼
            useCompiler().compile()
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
    CompilationResult        CompilerError
          │                       │
          ▼                       ▼
   StepNavigation           <ErrorDisplay />
          │
          ▼
      StepContent
          │
   ┌──────┼──────────────┬──────────────┬─────────────┐
   ▼      ▼              ▼              ▼             ▼
tokens  postfix       eps-NFA          DFA       minimized DFA
                    <NfaGraph/>    <DfaGraph/>   <DfaGraph
                    <NfaTable/>  <TransitionTable/>  kind="minimized-dfa"/>
                                   <DfaMapping/>
                                        │
                                        ▼
                                <StringSimulator />
                              type a string, see it
                              accepted or rejected
```

## Page structure

```text
┌───────────────────────────────────────────────────────┐
│  Regular Expression to DFA Visualizer                 │
│  one-line explanation of what the tool does           │
├───────────────────────────────────────────────────────┤
│  Regular expression                                   │
│  [ (a|b)*abb                        ]  [ Convert ]    │
│                                                       │
│  Examples:  a   a|b   ab   a*   (a|b)*   (a|b)*abb    │
├───────────────────────────────────────────────────────┤
│  [error message, when there is one]                   │
├───────────────────────────────────────────────────────┤
│  1 Regex  2 Tokens  3 Concat  4 Postfix  5 NFA  ...   │
├───────────────────────────────────────────────────────┤
│  Step title                                           │
│  What this step does, in two sentences.               │
│                                                       │
│  [ the step content: text, graph or table ]           │
│                                                       │
│  [ how this works - the algorithm explanation ]       │
└───────────────────────────────────────────────────────┘
```

## Components

| Component              | Job                                            |
| ---------------------- | ---------------------------------------------- |
| `RegexInput`           | text field plus Convert button                 |
| `ExampleExpressions`   | clickable examples from `src/data/examples.ts` |
| `StepNavigation`       | tabs across the pipeline stages                |
| `StepContent`          | panel for the active step                      |
| `AlgorithmExplanation` | prose about the current algorithm              |
| `TransitionTable`      | DFA table, states by symbols                   |
| `NfaTable`             | NFA table, epsilon column and set-valued cells |
| `DfaMapping`           | which NFA states each DFA state came from      |
| `StringSimulator`      | test-string input, verdict and trace           |
| `ErrorDisplay`         | user-facing error, role="alert"                |
| `LoadingState`         | while compiling                                |
| `EmptyState`           | before anything is compiled                    |

Each is presentational: props in, markup out. State lives in `AppContext`.

## Step content

| Step          | Shows                                                      |
| ------------- | ---------------------------------------------------------- |
| Regex         | the input, and the alphabet derived from it                |
| Tokens        | the token list, one chip per token                         |
| Concatenation | the expression with `.` inserted, insertions marked        |
| Postfix       | the postfix string, with the infix above it to compare     |
| eps-NFA       | `<NfaGraph />` and `<NfaTable />`                          |
| DFA           | `<DfaGraph />`, `<TransitionTable />`, `<DfaMapping />`    |
| Minimized DFA | the minimized graph and table, and which states merged     |
| Simulation    | `<StringSimulator />` driving a highlighted `<DfaGraph />` |

Each step also gets an `<AlgorithmExplanation />`. The copy comes from
`COMPILER_PIPELINE.md` so the app and the docs cannot drift apart.

## Display conventions

Not negotiable, because they are what makes the app teach correctly:

| Data            | Displayed as                              |
| --------------- | ----------------------------------------- |
| state id `0`    | `q0`                                      |
| `symbol: null`  | the epsilon glyph                         |
| a state set     | `{q1, q3}`                                |
| no transition   | an em dash, never `null`                  |
| accepting state | double border in graphs, a mark in tables |

`formatStateId()` in `src/hooks/useCompiler.ts` is the single place ids become
labels.

## Tables

**NFA table** - rows are states, columns are the alphabet plus an epsilon column
placed last. Cells hold sets: `{q1, q3}`. An empty cell is an em dash.

**DFA table** - rows are states, columns are the alphabet. Cells hold a single
state or an em dash. Mark the start state with an arrow and accepting states
with an asterisk.

**DFA mapping** - three columns: DFA state, the NFA subset, accepting or not.
For the minimized DFA, say in the caption that a row subset is the union of the
merged states subsets.

All three use `<caption>`, `<th scope="col">` and `<th scope="row">`. A table
without scoped headers is unusable with a screen reader.

## String simulator

1. The user types a test string (the empty string is valid input).
2. Press Run, or type with a debounce.
3. Show the verdict: accepted or rejected, with a colour AND a word.
4. Show the trace, state by state and symbol by symbol.
5. Stepping through the trace highlights the state and the transition in the
   graph via the `highlight` prop.

A rejected string is a normal result. Show it in the simulator own area, not
through `<ErrorDisplay />`, and say why - no transition on that symbol from that
state, or the run ended in a state that does not accept.

## States of the page

| Condition            | Renders            |
| -------------------- | ------------------ |
| nothing compiled yet | `<EmptyState />`   |
| compiling            | `<LoadingState />` |
| compilation failed   | `<ErrorDisplay />` |
| compiled             | steps and content  |

Compilation is synchronous and fast, so the loading state will rarely be seen.
It still exists, because a large expression can take long enough to notice, and
because a component that only appears under load is one nobody has tested.

## Responsive design

| Width      | Layout                                                       |
| ---------- | ------------------------------------------------------------ |
| >= 1024px  | full width up to `--content-max-width`, tables beside graphs |
| 640-1024px | single column, tables under graphs                           |
| < 640px    | stacked, step navigation scrolls horizontally, graphs pan    |

No horizontal page scroll at any width. Tables scroll inside their own container
rather than widening the page.

## Accessibility

Not a polish item - build it in from the first component.

- Every input has a real `<label>`. Placeholder text is not a label.
- Step navigation uses the tablist pattern: `role="tablist"`, `role="tab"`,
  `aria-selected`, `aria-controls`, and arrow-key movement between tabs.
- Errors use `role="alert"` so they are announced.
- The loading state uses `role="status"` with `aria-live="polite"`.
- Focus is always visible; `globals.css` sets a `:focus-visible` outline.
- Colour is never the only signal. Accepted and rejected carry a word; accepting
  states carry a double border.
- Text contrast meets WCAG AA in both light and dark themes.
- Keyboard only: a user must be able to type an expression, convert it, move
  through every step and run a simulation without a mouse.

## Styling

Plain CSS with the custom properties in `src/styles/variables.css`. No CSS-in-JS,
no Tailwind - see `DECISIONS.md`.

- `variables.css` - tokens. Shared; coordinate before renaming one.
- `globals.css` - reset, element defaults, page shell.
- `styles/components/` - one file per component, imported by that component.

Use a token rather than a literal colour. If a token is missing, add it to
`variables.css` rather than hard-coding a value in one component.

Dark mode is handled by `prefers-color-scheme` in `variables.css` and comes free
as long as everything uses tokens.

## Testing

`tests/components/`. Use the fixtures in `tests/fixtures/`, not `compileRegex`.

Test behaviour a user can observe: the field submits, an error is announced, the
tab switches, a state set renders as `{q1, q3}`. Query by role and label, never
by class name.
