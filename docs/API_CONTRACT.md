# API Contract

The public surface each module offers the others. Nothing outside these lists is
importable across a module boundary.

## Import rules

```ts
// Correct
import { compileRegex, simulate } from '@/compiler';
import type { CompilationResult, DFA, NFA } from '@/compiler';
import { NfaGraph, DfaGraph } from '@/visualization';

// Wrong - reaches past the public index
import { thompsonConstruction } from '@/compiler/thompson';
import { StateNode } from '@/visualization/components/StateNode';
```

The one exception: a module's own tests may import its internals directly.
`tests/compiler/` may import `@/compiler/tokenizer`; `tests/components/` may not.

---

## Compiler - `src/compiler/index.ts`

Owner: Person 1.

### `compileRegex(regex: string): CompilationResult`

The primary entry point. Runs stages 1-8 and returns everything the UI needs.

Throws `CompilerError` (or a subclass) and nothing else. Any unexpected failure
must be wrapped in `InternalCompilerError` before it leaves this function, so
callers only ever need one catch shape.

```ts
const result = compileRegex('(a|b)*abb');
result.postfix; // "ab|*a.b.b."
result.nfa; // NFA
result.minimizedDfa; // DFA
```

### `simulate(dfa: DFA, input: string): SimulationResult`

Runs a test string. Exported separately because the UI calls it on demand, not
during compilation. Does not throw for a rejected string.

### `PIPELINE_STEPS: readonly CompilationStep[]`

The canonical stage list - ids, titles and generic descriptions. Person 3 builds
the step navigation against this; Person 1 returns run-specific versions in
`CompilationResult.steps`.

### Errors

| Export                  | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `CompilerError`         | base class, carries `code`, `position`, `details`      |
| `RegexSyntaxError`      | malformed user input                                   |
| `InternalCompilerError` | broken invariant - always a bug, never the user        |
| `isCompilerError(v)`    | narrowing helper for catch blocks                      |
| `GENERIC_ERROR_MESSAGE` | fallback text for anything that is not a CompilerError |
| `CompilerErrorCode`     | the union of codes                                     |

### Types and constants

`EPSILON`, `EPSILON_DISPLAY`, and the types `AlphabetSymbol`,
`CompilationResult`, `CompilationStep`, `CompilationStepId`, `DFA`, `DFAState`,
`Epsilon`, `NFA`, `SimulationResult`, `SimulationStep`, `Symbol`, `Transition`.

### Deliberately private

`validate`, `tokenize`, `insertExplicitConcatenation`, `infixToPostfix`,
`thompsonConstruction`, `epsilonClosure`, `move`, `subsetConstruction`,
`minimizeDfa`. Person 1 may change their signatures freely.

---

## Visualization - `src/visualization/index.ts`

Owner: Person 2.

### `<NfaGraph />`

```tsx
<NfaGraph nfa={result.nfa} />
<NfaGraph nfa={result.nfa} highlight={{ states: [3] }} height={480} />
```

| Prop        | Type                       | Required | Notes                               |
| ----------- | -------------------------- | -------- | ----------------------------------- |
| `nfa`       | `NFA \| null \| undefined` | yes      | `null` renders the empty state      |
| `highlight` | `GraphHighlight`           | no       | states and transitions to emphasise |
| `height`    | `number \| string`         | no       | defaults to `--graph-height`        |
| `className` | `string`                   | no       | extra class on the wrapper          |

### `<DfaGraph />`

```tsx
<DfaGraph dfa={result.dfa} />
<DfaGraph dfa={result.minimizedDfa} kind="minimized-dfa" />
```

Same props as `NfaGraph`, with `dfa` instead of `nfa`, plus:

| Prop   | Type                       | Required | Notes                       |
| ------ | -------------------------- | -------- | --------------------------- |
| `kind` | `'dfa' \| 'minimized-dfa'` | no       | changes legend wording only |

### Types

`AutomatonKind`, `DfaGraphProps`, `GraphHighlight`, `NfaGraphProps`,
`StateNodeData`, `TransitionEdgeData`.

### Guarantees

- A `null` or `undefined` automaton renders the empty state. It never crashes.
- No graph component calls `compileRegex`, reads `AppContext`, or imports
  anything from `src/components/`.
- Layout is deterministic: the same automaton always lays out the same way.

### Deliberately private

`AutomataGraph`, `StateNode`, `TransitionEdge`, `GraphControls`, `GraphLegend`,
`EmptyGraphState`, `adaptNfa`, `adaptDfa`, `layoutAutomaton`.

---

## UI - `src/hooks/useCompiler.ts` and `src/context/AppContext.tsx`

Owner: Person 3. Internal to the UI layer, listed here because both other
modules need to know the wiring exists.

### `useCompiler(): UseCompilerApi`

```ts
const { result, error, isCompiling, compile, reset } = useCompiler();
```

The only place `compileRegex` is called. `error` is always a user-facing string
or `null`; developer detail stays on the thrown error object.

### `useAppContext(): AppContextValue`

`useCompiler`'s API plus `expression` / `setExpression` and `activeStep` /
`setActiveStep`. Throws if used outside `<AppProvider>`.

### `formatStateId(id: number): string`

`0` becomes `"q0"`. The one place the STATE ID CONTRACT turns into a label.

---

## Changing a public API

1. Tell the other two people before you write the code.
2. Make the change.
3. Update this document in the same commit.
4. Run `npm run build` - a broken consumer is a compile error, not a surprise
   at integration time.
5. Note it in `TEAM_STATUS.md`.
