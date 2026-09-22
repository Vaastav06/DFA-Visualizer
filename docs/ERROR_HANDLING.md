# Error Handling

## The core distinction

```text
USER-FACING MESSAGE              DEVELOPER / DEBUG INFORMATION
-------------------              -----------------------------
CompilerError.message            CompilerError.details
CompilerError.position           CompilerError.stack
                                 the error's class name

rendered by <ErrorDisplay />     console only, in dev
written for a student            written for whoever debugs it
no file names, no stack traces   file names and state counts welcome
```

Everything a user reads comes from `error.message`. Nothing else reaches the
screen. A student who sees `InternalCompilerError: directDfa.ts:84 invariant
broken` learns nothing and assumes they broke something.

## The error taxonomy

`src/compiler/errors.ts`:

```text
Error
 └── CompilerError            code, position?, details?
      ├── RegexSyntaxError    the user's expression is malformed
      └── InternalCompilerError   an invariant broke - always our bug
```

| Code                        | Cause                 | User sees something like                                                                      |
| --------------------------- | --------------------- | --------------------------------------------------------------------------------------------- |
| `EMPTY_INPUT`               | nothing typed         | "Enter a regular expression to get started."                                                  |
| `INVALID_CHARACTER`         | unsupported character | "The character '#' is not supported. Use letters, digits, and the operators \|, \*, ( and )." |
| `UNBALANCED_PARENTHESES`    | `(a\|b`               | "There is an opening parenthesis without a matching closing one."                             |
| `EMPTY_GROUP`               | `()`                  | "Empty groups are not allowed. Put an expression inside the parentheses."                     |
| `INVALID_OPERATOR_POSITION` | `*a`, `\|a`, `a\|`    | "An expression cannot start with '\*'. Put a symbol before it."                               |
| `DANGLING_OPERATOR`         | `a**`, `a\|\|b`       | "Two operators appear in a row. Check the expression around position 2."                      |
| `INTERNAL_ERROR`            | a bug                 | `GENERIC_ERROR_MESSAGE`                                                                       |

## Writing a user-facing message

- Say what is wrong, in plain words.
- Say what to do about it, when there is an obvious fix.
- Name the position when you know it.
- Do not name a file, a function, a stack frame or an algorithm.
- Do not blame: "Unbalanced parentheses" beats "You forgot a parenthesis".
- No exclamation marks, no "Oops".

Good:

```text
There is an opening parenthesis without a matching closing one, at position 3.
```

Bad:

```text
Error: validateParens() failed - stack depth 1 at index 3
Oops! Something went wrong!
Invalid input
```

The last one is bad because it is true of every error and helps with none.

## Where each layer handles errors

### Compiler (Person 1)

Throws. Never returns an error object, never returns `null` to signal failure,
never logs to the console.

```ts
if (openCount !== closeCount) {
  throw new RegexSyntaxError(
    'UNBALANCED_PARENTHESES',
    'There is an opening parenthesis without a matching closing one.',
    { position: index, details: `open=${openCount} close=${closeCount}` }
  );
}
```

Anything unexpected gets wrapped before it leaves `compileRegex`, so callers
only handle one shape:

```ts
try {
  return runPipeline(regex);
} catch (error) {
  if (isCompilerError(error)) throw error;
  throw new InternalCompilerError(GENERIC_ERROR_MESSAGE, String(error));
}
```

### Visualization (Person 2)

Does not throw for missing data. A `null` automaton renders the empty state; an
automaton with zero states renders the empty state. Both are normal situations,
not errors.

The one case worth surfacing loudly is an epsilon transition inside a DFA - that
means the compiler produced something impossible, and silently drawing it hides
a real bug.

### UI (Person 3)

Catches in exactly one place, `useCompiler`:

```ts
catch (error) {
  const message = isCompilerError(error) ? error.message : GENERIC_ERROR_MESSAGE;
  setState({ result: null, error: message, isCompiling: false });
}
```

Then `<ErrorDisplay message={error} />` renders it with `role="alert"`, so screen
readers announce it.

No other component has a try/catch around compilation. If two components can
each produce an error message, the two messages will eventually disagree.

## What is NOT an error

| Situation                      | Handle as                                   |
| ------------------------------ | ------------------------------------------- |
| the simulator rejects a string | a `SimulationResult` with `accepted: false` |
| no expression compiled yet     | `<EmptyState />`                            |
| a graph has nothing to draw    | `<EmptyGraphState />`                       |
| a compilation is in flight     | `<LoadingState />`                          |

A rejected string is the DFA working correctly. Routing it through
`<ErrorDisplay />` teaches the student the wrong thing.

## Empty input

Pressing Convert with an empty field is an `EMPTY_INPUT` error from the
validator, not a silent no-op. The user pressed a button and deserves a reply.

The Convert button may additionally be disabled while the field is empty - that
is a UI nicety, not a substitute for the validator rule.

## Unexpected internal errors

If `compileRegex` throws something that is not a `CompilerError`, that is a bug
in our code. The user sees `GENERIC_ERROR_MESSAGE`; the developer gets the real
error in the console in development. The app stays usable: the previous result
is cleared, the input keeps its text, and the user can edit and retry.

## Testing errors

Each error code needs a test in `tests/compiler/` that asserts the **code**, not
the message text:

```ts
expect(() => compileRegex('(a|b')).toThrowError(
  expect.objectContaining({ code: 'UNBALANCED_PARENTHESES' })
);
```

Asserting on message text makes every wording improvement break a test, which
teaches the team to stop improving the wording.
