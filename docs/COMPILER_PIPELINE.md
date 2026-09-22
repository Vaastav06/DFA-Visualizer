# Compiler Pipeline

## The pipeline

```text
          Regular Expression        "(a|b)*abb"
                  │
                  ▼
        ┌───────────────────┐
        │  1  Validation    │  validator.ts        throws or returns
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │  2  Tokenization  │  tokenizer.ts        string   -> string[]
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │  3  Explicit "."  │  explicitConcatenation.ts
        └─────────┬─────────┘                      string[] -> string[]
                  ▼
        ┌───────────────────┐
        │  4  Postfix       │  infixToPostfix.ts   string[] -> string[]
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │  5  Syntax Tree   │  syntaxTree.ts       string[] -> SyntaxNode (with "#")
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │  6  Positions     │  positions.ts        SyntaxNode -> PositionInfo[]
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │  7  Analysis      │  nullable.ts, firstpos.ts, lastpos.ts
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │  8  Followpos     │  followpos.ts        -> FollowPosEntry[]
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │  9  Direct DFA    │  directDfa.ts        -> DFA
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │ 10  Minimization  │  minimizeDfa.ts      DFA -> DFA
        └─────────┬─────────┘
                  ▼               minimized DFA
        ┌───────────────────┐
        │ 11  Simulation    │  simulator.ts        DFA x string -> SimulationResult
        └───────────────────┘                      (on demand, not part of compile)
```

Stages 1-10 run inside `compileRegex`. Stage 11 runs when the user types a test
string, so it is exported separately.

---

## Stage 1 - Validation

**File** `src/compiler/validator.ts` - **Signature** `validate(regex: string): void`

Rejects malformed input before any other stage sees it. Returns nothing on
success; throws `RegexSyntaxError` on failure.

| Condition                           | Code                        |
| ----------------------------------- | --------------------------- |
| empty or whitespace-only            | `EMPTY_INPUT`               |
| character outside the supported set | `INVALID_CHARACTER`         |
| `(` without `)` or vice versa       | `UNBALANCED_PARENTHESES`    |
| `()`                                | `EMPTY_GROUP`               |
| leading star or bar, trailing bar   | `INVALID_OPERATOR_POSITION` |
| `**`, bar-star, open-bar, bar-close | `DANGLING_OPERATOR`         |

Every later stage may assume its input is well formed.

---

## Stage 2 - Tokenization

**File** `src/compiler/tokenizer.ts` - **Signature** `tokenize(regex: string): string[]`

Splits the expression into one token per meaningful character. Whitespace is dropped.

```text
"(a|b)*abb"  ->  ["(", "a", "|", "b", ")", "*", "a", "b", "b"]
```

---

## Stage 3 - Explicit concatenation

**File** `src/compiler/explicitConcatenation.ts`

**Signature** `insertExplicitConcatenation(tokens: string[]): string[]`

Concatenation is written by juxtaposition (`ab` means "a then b"), which the
shunting-yard algorithm cannot see. This stage makes it visible by inserting the
internal operator `.`.

Insert a `.` between `left` and `right` when:

| `left` is             | and `right` is   |
| --------------------- | ---------------- |
| a literal, `)` or `*` | a literal or `(` |

```text
["(", "a", "|", "b", ")", "*", "a", "b", "b"]
     ->  ["(", "a", "|", "b", ")", "*", ".", "a", ".", "b", ".", "b"]
```

---

## Stage 4 - Infix to postfix

**File** `src/compiler/infixToPostfix.ts`

**Signature** `infixToPostfix(tokens: string[]): string[]`

The shunting-yard algorithm. Parentheses disappear; the output contains only
literals and operators.

Precedence, highest binds tightest:

| Operator | Meaning       | Arity          | Precedence |
| -------- | ------------- | -------------- | ---------- |
| `*`      | Kleene star   | unary, postfix | 3          |
| `.`      | concatenation | binary, left   | 2          |
| bar      | alternation   | binary, left   | 1          |

```text
["(", "a", "|", "b", ")", "*", ".", "a", ".", "b", ".", "b"]
     ->  ["a", "b", "|", "*", "a", ".", "b", ".", "b", "."]
```

---

## Stage 5 - Syntax Tree & Augmentation

**File** `src/compiler/syntaxTree.ts`

**Signature** `buildSyntaxTree(postfix: string[], augment = true): SyntaxNode`

Builds an explicit abstract syntax tree from the postfix tokens and augments it
with the unique internal end-marker `#`:
```text
CONCAT(r, #)
```
The `#` symbol receives its own leaf position and determines DFA acceptance.

---

## Stage 6 - Position Numbering

**File** `src/compiler/positions.ts`

**Signature** `assignPositions(root: SyntaxNode): PositionAssignmentResult`

Performs a deterministic left-to-right traversal over all leaf symbol nodes,
assigning 1-based integer positions (`1, 2, 3, ...`). Returns the position table
`PositionInfo[]` and the position assigned to `#` (`endMarkerPosition`).

---

## Stage 7 - Nullable, Firstpos, Lastpos Analysis

**Files**
- `src/compiler/nullable.ts` - `calculateNullable(node: SyntaxNode): boolean`
- `src/compiler/firstpos.ts` - `calculateFirstpos(node: SyntaxNode): number[]`
- `src/compiler/lastpos.ts` - `calculateLastpos(node: SyntaxNode): number[]`

Computes the standard compiler design attributes for every node in the tree:

### Nullable
- `nullable(symbol)` = `false`
- `nullable(A | B)` = `nullable(A) || nullable(B)`
- `nullable(A . B)` = `nullable(A) && nullable(B)`
- `nullable(A*)` = `true`

### Firstpos
- `firstpos(pos)` = `{ pos }`
- `firstpos(A | B)` = `firstpos(A) ∪ firstpos(B)`
- `firstpos(A . B)` = `nullable(A) ? (firstpos(A) ∪ firstpos(B)) : firstpos(A)`
- `firstpos(A*)` = `firstpos(A)`

### Lastpos
- `lastpos(pos)` = `{ pos }`
- `lastpos(A | B)` = `lastpos(A) ∪ lastpos(B)`
- `lastpos(A . B)` = `nullable(B) ? (lastpos(A) ∪ lastpos(B)) : lastpos(B)`
- `lastpos(A*)` = `lastpos(A)`

All sets are represented as canonical, sorted, duplicate-free integer arrays.

---

## Stage 8 - Followpos Table

**File** `src/compiler/followpos.ts`

**Signature** `calculateFollowpos(root: SyntaxNode, positions: PositionInfo[]): FollowPosEntry[]`

Applies the two standard followpos rules:
1. **Concatenation rule**: for each `concat(A, B)`, for every `i ∈ lastpos(A)`, add `firstpos(B)` to `followpos(i)`.
2. **Kleene star rule**: for each `star(A)`, for every `i ∈ lastpos(A)`, add `firstpos(A)` to `followpos(i)`.

---

## Stage 9 - Direct DFA Construction

**File** `src/compiler/directDfa.ts`

**Signature** `constructDirectDFA(root: SyntaxNode, alphabet: string[], followpos: FollowPosEntry[], endMarkerPosition: number): DFA`

Constructs the DFA directly from position sets without any intermediate NFA:
1. Start state: `D0 = firstpos(root)`.
2. For each unmarked DFA state `S` and each input symbol `a ∈ alphabet`:
   ```text
   U = ∪ { followpos(p) | p ∈ S and symbol(p) == a }
   ```
   If `U` is non-empty:
   - Intern `U` using canonical key `"p1,p2,..."`.
   - If `U` is new, allocate state ID `0..n-1`.
   - Add transition `S --a--> U`.
3. Accepting state rule: state `S` is accepting iff `S.positions.includes(endMarkerPosition)`.

**Dead-state policy**: Empty position sets are not materialized (Decision D-006: partial DFA, missing transition means reject).

---

## Stage 10 - Minimization

**File** `src/compiler/minimizeDfa.ts` - **Signature** `minimizeDfa(dfa: DFA): DFA`

Produces the smallest DFA recognising the same language:
1. Remove states unreachable from the start state.
2. Remove dead states - those from which no accepting state is reachable.
3. Partition the rest into accepting and non-accepting blocks.
4. Refine using Moore's partition refinement until no block splits.
5. Renumber surviving blocks `0..m-1` by BFS starting from the start state block.
6. For each merged state, `positions` is the sorted union of its members' positions.

---

## Stage 11 - Simulation

**File** `src/compiler/simulator.ts`

**Signature** `simulate(dfa: DFA, input: string): SimulationResult`

Runs a string through the DFA and records the full trace:
- `path[0]` is always `dfa.startState`.
- Halts with controlled error and `consumed` character count if an unknown symbol or missing transition occurs.
- Acceptance requires the entire string consumed and current state in `dfa.acceptStates`.

---

## Worked example: `(a|b)*abb`

```text
input           (a|b)*abb
tokens          ( a | b ) * a b b
explicit .      ( a | b ) * . a . b . b
postfix         a b | * a . b . b .
augmented #     ((a|b)*abb)#
positions       1:a, 2:b, 3:a, 4:b, 5:b, 6:#
followpos       1->[1,2,3], 2->[1,2,3], 3->[4], 4->[5], 5->[6], 6->[]
direct DFA      4 states:
                q0 = {1, 2, 3} (start)
                q1 = {1, 2, 3, 4}
                q2 = {1, 2, 3, 5}
                q3 = {1, 2, 3, 6} (accepting)
minimized DFA   4 states (already minimal)
simulate "abb"  accepted (q0 -> q1 -> q2 -> q3)
simulate "ab"   rejected
```
