# Regular Expression Specification

This is the exact syntax the project supports. The UI must not claim more than
this, and the validator must not accept more than this.

## Supported syntax

| Syntax  | Name                     | Example   | Matches                           |
| ------- | ------------------------ | --------- | --------------------------------- |
| `a`     | literal                  | `a`       | the single character `a`          |
| `ab`    | concatenation (implicit) | `ab`      | `a` followed by `b`               |
| `a\|b`  | alternation              | `a\|b`    | either `a` or `b`                 |
| `a*`    | Kleene star              | `a*`      | zero or more `a`, including empty |
| `(...)` | grouping                 | `(a\|b)*` | changes precedence                |

That is the whole language. Regular expressions built from these five forms can
describe every regular language, which is what makes them the right teaching set
for this project.

## Literals

A literal is any single character that is not an operator or a parenthesis.
In practice: letters and digits.

**Reserved characters**, which can never be literals:

```text
|   *   (   )   .
```

`.` is reserved because the compiler uses it internally as the explicit
concatenation operator (stage 3). It does NOT mean "any character" here, unlike
in most regex flavours. This is worth calling out in the UI, because every
student arrives expecting the other meaning.

There is no escape syntax. `\*` is not a way to match a literal asterisk; it is
an invalid character error.

## Precedence

Highest binds tightest:

```text
1.  *      Kleene star        unary, postfix
2.  .      concatenation      binary, left-associative
3.  |      alternation        binary, left-associative
```

Worked through:

| Expression | Reads as        | Because                               |
| ---------- | --------------- | ------------------------------------- |
| `ab*`      | `a . (b*)`      | `*` binds tighter than concatenation  |
| `(ab)*`    | `(a . b)*`      | parentheses override                  |
| `a\|bc`    | `a \| (b . c)`  | concatenation binds tighter than `\|` |
| `(a\|b)c`  | `(a \| b) . c`  | parentheses override                  |
| `a\|b\|c`  | `(a \| b) \| c` | `\|` is left-associative              |

## The empty string

There is no syntax for the empty string. `()` is an error (`EMPTY_GROUP`), not a
way to write epsilon.

The empty string is still part of the _language_ of many expressions - `a*`
matches it - and the simulator accepts an empty test string. It simply cannot be
written as an input expression.

## Not supported

These are common in other regex flavours and are **not** in this project. If a
user types one, the validator rejects it with a clear message rather than
silently doing something else.

| Syntax              | Why not                                                |
| ------------------- | ------------------------------------------------------ |
| `+`                 | Decided against for v1 - see below                     |
| `?`                 | Decided against for v1 - see below                     |
| `[a-z]`             | Character classes - sugar over `\|`, adds parsing work |
| `.` as "any char"   | The symbol is taken by explicit concatenation          |
| `^` `$`             | Anchors are not a regular-language construct here      |
| `\d` `\w` `\s`      | Escapes need an escape mechanism first                 |
| `{n,m}`             | Bounded repetition - expands to long concatenations    |
| `(?:...)` `(?=...)` | Non-capturing and lookaround groups                    |
| backreferences      | Not regular - they cannot be expressed as a DFA at all |

## On `+` and `?`

They are cheap to add, because both are sugar:

```text
a+   is   a . a*
a?   is   a | eps
```

`a+` needs only a rewrite before stage 3. `a?` needs an epsilon fragment in
Thompson's construction, since there is no epsilon literal in the token stream.

**Decision: not in v1.** Neither adds a new concept a student needs, and both
add validator rules, precedence entries and test cases. If the team decides to
add them later, they go in together with:

- new rows in the precedence table above (both bind like `*`)
- new validator rules (`+` and `?` are postfix, so the same placement rules as `*`)
- the "Not supported" row deleted
- a note in `DECISIONS.md` recording that the decision changed

Until that happens, do not accept them anywhere. Half-support is worse than no
support: an expression that parses but builds the wrong automaton is a bug the
student will blame on themselves.

## Examples used in the UI

From `src/data/examples.ts`:

| Expression     | Language                                    |
| -------------- | ------------------------------------------- |
| `a`            | exactly `a`                                 |
| `a\|b`         | `a` or `b`                                  |
| `ab`           | exactly `ab`                                |
| `a*`           | zero or more `a`                            |
| `(a\|b)*`      | any string over `{a, b}`, including empty   |
| `(a\|b)*abb`   | any string over `{a, b}` ending in `abb`    |
| `a(b\|c)*`     | an `a` followed by any number of `b` or `c` |
| `(a\|b)(c\|d)` | one of `a`,`b` then one of `c`,`d`          |

`(a|b)*abb` is the textbook example from the dragon book. Keep it - it produces
an NFA large enough to be interesting and a DFA small enough to read.
