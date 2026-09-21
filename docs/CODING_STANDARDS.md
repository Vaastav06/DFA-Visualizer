# Coding Standards

Most of this is enforced by ESLint and Prettier. Run `npm run lint` and
`npm run format` - do not argue with the formatter.

## TypeScript

**Strict mode is on and stays on.** `noUnusedLocals`, `noUnusedParameters` and
`noFallthroughCasesInSwitch` are on too.

**No `any`.** Use `unknown` and narrow it. If you genuinely need an escape
hatch, write a comment explaining why on the same line.

**Prefer `type` imports** so the bundler can drop them:

```ts
import type { NFA, DFA } from '@/compiler';
```

**Name things for what they are.** `epsilonClosure`, not `ec`. `nfaStates`, not
`ns`. The one-letter exceptions are the conventional ones: `i` for an index in a
short loop, `a` for an alphabet symbol in an automata algorithm.

**Interfaces for object shapes, types for unions and aliases.**

```ts
interface DFAState { ... }
type CompilationStepId = 'input' | 'tokens' | ...;
```

## Functions

**Pure where possible**, especially in the compiler. A function that takes a DFA
and returns a DFA must not mutate the input.

```ts
// Wrong - the caller result changes under them
function minimizeDfa(dfa: DFA): DFA {
  dfa.states = dfa.states.filter(reachable);
  return dfa;
}

// Right
function minimizeDfa(dfa: DFA): DFA {
  return { ...dfa, states: dfa.states.filter(reachable) };
}
```

**One job per function.** If you cannot name it without "and", split it.

**Document the contract, not the code.** A header comment that says what the
function guarantees is worth writing. A comment that says `// increment i` is
not.

## React

**Function components with typed props.** No class components.

```tsx
interface RegexInputProps {
  value: string;
  onSubmit: (value: string) => void;
}

export function RegexInput({ value, onSubmit }: RegexInputProps) { ... }
```

**Props interfaces are named `<Component>Props`** and declared directly above
the component.

**Named exports**, except for `App`, which is the default export because
`main.tsx` expects one.

**Derive, do not duplicate.** If a value can be computed from props, compute it
with `useMemo` rather than mirroring it into state.

**Keys are stable identities.** A state id, not an array index.

**Hooks obey the rules of hooks.** The lint plugin enforces it; do not silence
it with a disable comment.

## File organisation

One component per file, named after the component. `RegexInput.tsx` exports
`RegexInput`.

Import order, separated by blank lines:

```ts
// 1. external
import { useMemo } from 'react';

// 2. cross-module, through the public index
import { compileRegex } from '@/compiler';
import { DfaGraph } from '@/visualization';

// 3. within this module
import { TransitionTable } from './TransitionTable';

// 4. styles last
import './RegexInput.css';
```

## CSS

**Tokens, not literals.**

```css
/* Wrong */
color: #2f6feb;

/* Right */
color: var(--accent);
```

If the token you need does not exist, add it to `variables.css` and tell the
team - do not hard-code the value in one component.

**Class naming is BEM-ish**, matching what is already in `globals.css`:

```css
.regex-input {
}
.regex-input__field {
}
.regex-input--disabled {
}
```

**No inline styles** except for genuinely dynamic values such as a computed node
position.

**Component styles live in `src/styles/components/`**, one file per component,
imported by that component.

## Comments

Write a comment when the **why** is not obvious from the code:

```ts
// The empty set is not materialised as a dead state, so a missing
// transition means reject. See docs/COMPILER_PIPELINE.md stage 7.
```

Do not write a comment that restates the code. Do not leave commented-out code -
git remembers it.

`TODO(Person N):` is the marker for scaffolding that is waiting for its owner.
It should say who and what:

```ts
// TODO(Person 2): replace the placeholder layout with BFS layering.
```

## Naming conventions

| Thing            | Convention          | Example                 |
| ---------------- | ------------------- | ----------------------- |
| component file   | PascalCase          | `RegexInput.tsx`        |
| module file      | camelCase           | `subsetConstruction.ts` |
| component        | PascalCase          | `RegexInput`            |
| function         | camelCase           | `epsilonClosure`        |
| type / interface | PascalCase          | `CompilationResult`     |
| constant         | SCREAMING_SNAKE     | `EPSILON_DISPLAY`       |
| CSS class        | kebab-case, BEM     | `.step-nav__item`       |
| test file        | matches its subject | `tokenizer.test.ts`     |

## What ESLint enforces

- no unused variables (prefix with `_` to keep one deliberately)
- rules of hooks
- `eqeqeq` - use `===`, except against `null`, where `== null` catching
  `undefined` too is often what you want
- `no-console` warns; `console.warn` and `console.error` are allowed

A disable comment needs a reason:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- third-party types are wrong here
```
