# Testing Strategy

## Tooling

| Tool                          | Role                                     |
| ----------------------------- | ---------------------------------------- |
| Vitest                        | runner, assertions, mocking              |
| jsdom                         | DOM environment for component tests      |
| React Testing Library         | rendering and querying components        |
| `@testing-library/jest-dom`   | DOM matchers such as `toBeInTheDocument` |
| `@testing-library/user-event` | realistic clicks and typing              |

Configuration is in `vite.config.ts` under `test`. Globals are on, so
`describe`, `it` and `expect` need no import - importing them anyway is fine and
the seed tests do.

```bash
npm test          # run once
npm run test:watch # re-run on change
```

## Directory ownership

```text
tests/
├── compiler/        Person 1   algorithms, pure functions
├── visualization/   Person 2   adapters, layout, graph components
├── components/      Person 3   UI components
├── integration/     joint      the whole flow, nothing mocked
└── fixtures/        shared     mock automata
```

A file belongs in the directory of whoever owns the code it tests. Nobody edits
another person directory without asking.

## What to test where

### `tests/compiler/` - Person 1

Pure functions with no DOM. These are the easiest and most valuable tests in the
project, because an automaton is either right or wrong.

Per stage:

| Stage          | Test                                                            |
| -------------- | --------------------------------------------------------------- |
| validator      | one test per error code, asserting `code`, not message text     |
| tokenizer      | token counts and order for each example expression              |
| concatenation  | the insertion rule, including `)a`, `*a` and `a(`               |
| infixToPostfix | precedence and associativity, parentheses removed               |
| thompson       | state count invariants, exactly one accept state, eps uses null |
| epsilonClosure | closure over a cycle terminates; results are sorted and unique  |
| subset         | determinism, `nfaStates` correctness, no eps in the output      |
| minimize       | the input is not mutated; equivalent states merge; ids dense    |
| simulator      | accept, reject, empty string, symbol outside the alphabet       |

**Assert properties, not exact structures.** The exact state numbering depends
on allocation order, which is an implementation detail Person 1 should be free
to change. This is fragile:

```ts
expect(nfa).toEqual({ states: [0, 1, 2, 3], ... }); // breaks on any refactor
```

This is not:

```ts
expect(nfa.acceptStates).toHaveLength(1);
expect(nfa.alphabet).toEqual(['a', 'b']);
expect(nfa.transitions.filter((t) => t.symbol === null).length).toBeGreaterThan(0);
```

**The strongest compiler test is behavioural**: build the DFA, then simulate
strings against it.

```ts
const { minimizedDfa } = compileRegex('(a|b)*abb');
expect(simulate(minimizedDfa, 'abb').accepted).toBe(true);
expect(simulate(minimizedDfa, 'aabb').accepted).toBe(true);
expect(simulate(minimizedDfa, 'ab').accepted).toBe(false);
expect(simulate(minimizedDfa, '').accepted).toBe(false);
```

That asserts the language, which is what actually has to be correct, and it
survives every internal refactor. Write one of these per example expression and
the compiler is genuinely covered.

### `tests/visualization/` - Person 2

Use the fixtures. Never call `compileRegex` here: a compiler bug would then fail
the visualization suite and send Person 2 debugging someone else code.

- NFA adapter merges parallel transitions into one edge; DFA adapter keeps
  them separate (one edge per symbol, distinct ids/labels)
- `symbol === null` becomes `isEpsilon`
- start and accepting flags reach the node data
- DFA nodes carry `nfaStates`
- layout is deterministic (two calls, equal results)
- public components render the empty state for `null`
- graph controls are reachable by their accessible names

Do not test pixel positions or React Flow internal behaviour.

### `tests/components/` - Person 3

Use the fixtures, especially `MOCK_COMPILATION_RESULT`.

- the input submits its value
- an error is announced with `role="alert"`
- the examples all render and are clickable
- step navigation switches panels and sets `aria-selected`
- tables render `q0` for id `0`, an em dash for a missing transition, and
  `{q1, q3}` for a set
- the simulator shows accepted and rejected differently

Query by role, label or text. Never by class name - a class is a styling detail
and a test that asserts it blocks restyling.

### `tests/integration/` - joint

The real wiring, nothing mocked. One end-to-end test carries most of the value:

```text
render <App />
type (a|b)*abb
click Convert
assert the postfix appears
step to the DFA
assert a graph rendered
type abb in the simulator
assert it is accepted
```

That single test proves all three modules agree on the contract - which is the
risk this project actually has.

## Coverage

No enforced threshold. A percentage would push everyone toward testing trivial
components instead of the algorithms.

The bar is: **every compiler stage has tests, and every public API has at least
one test.** A pull request that adds an algorithm without tests does not merge.

## Writing tests

- One behaviour per `it`. A test that asserts five things reports one failure.
- Name the test after the behaviour, not the function: `rejects an expression
that starts with a star` beats `validate test 3`.
- Arrange, act, assert - in that order, with a blank line between.
- Prefer a fixture over building an automaton inline in the test.
- If a test needs a comment to explain what it asserts, the assertion is
  probably wrong.

## Before pushing

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All four must pass. `npm run build` runs the typechecker across the whole
project, so it catches a contract break that a single-module test run will not.
