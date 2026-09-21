# Glossary

Terms used across the code and the documentation. Where a term has a specific
meaning in THIS project that differs from the general one, that is called out.

---

**Accepting state** (also _final state_) - a state where, if the input has been
fully consumed, the string is accepted. Drawn with a double border. In the data:
`DFAState.isAccepting`, and the id appears in `acceptStates`.

**Alphabet** - the set of input symbols the automaton reads. In this project it
is derived from the literals in the regular expression. It never contains
epsilon.

**Alternation** - the `|` operator. `a|b` matches either `a` or `b`. Lowest
precedence of the three operators.

**Concatenation** - one expression followed by another. Written by juxtaposition
(`ab`), made explicit as `a.b` in stage 3 so the shunting-yard algorithm can see
it.

**DFA** - Deterministic Finite Automaton. From each state, each symbol leads to
at most one state, and there are no epsilon transitions. What the project is
building.

**Dead state** (also _trap state_) - a non-accepting state that every symbol
loops back to. This project deliberately does **not** create one; a missing
transition means reject. See D-006.

**Determinism** - the property that each `(state, symbol)` pair has at most one
target. Also, separately, the requirement that the graph layout produces the
same positions every time (D-007).

**Epsilon** (written as the Greek letter in the UI) - the empty string. An
epsilon transition can be taken without consuming input. **Internally always
`null`.** See D-001.

**Epsilon closure** - the set of states reachable from a given set using only
epsilon transitions, including the starting states themselves. The operation
that makes subset construction work.

**eps-NFA** - an NFA that has epsilon transitions. What Thompson's construction
produces.

**Explicit concatenation** - the stage that inserts `.` between tokens where
concatenation was implied. Stage 3 of the pipeline.

**Fragment** - during Thompson's construction, a partially built NFA with one
start state and one accept state, sitting on the stack.

**Infix** - normal operator-between-operands notation: `a|b`. What the user
types.

**Kleene star** - the `*` operator. `a*` matches zero or more `a`, including the
empty string. Highest precedence.

**Literal** - a single character that is not an operator or a parenthesis. The
only kind of symbol this project supports.

**Minimization** - merging equivalent states and dropping unreachable ones to
produce the smallest DFA for the same language. Stage 8.

**move(S, a)** - the set of states reachable from set `S` by exactly one
transition on symbol `a`, with no epsilon steps.

**NFA** - Non-deterministic Finite Automaton. A `(state, symbol)` pair may lead
to several states, and epsilon transitions are allowed.

**Postfix** (also _reverse Polish notation_) - operators written after their
operands: `ab|` for `a|b`. Stage 4. It is what lets Thompson's construction be a
single pass over a stack.

**Precedence** - which operator binds tighter. Here: `*` then `.` then `|`.

**Regular expression** - a pattern describing a regular language. This project
supports literals, `|`, concatenation, `*` and `()`. See
`REGEX_SPECIFICATION.md`.

**Regular language** - a language recognisable by a finite automaton. Exactly
the languages regular expressions can describe.

**Shunting-yard algorithm** - Dijkstra's algorithm for converting infix to
postfix using an operator stack. Stage 4.

**Simulation** - running an input string through a DFA and recording the states
visited. Stage 9. A rejected string is a normal result, not an error.

**Start state** - where the automaton begins. Drawn with an incoming arrow from
nowhere. Always id `0` in a DFA produced by this project.

**State** - a node of the automaton. Identified by a non-negative integer,
displayed as `qN`. See D-002.

**Subset construction** (also _powerset construction_) - turning an NFA into a
DFA by making each DFA state one epsilon-closed set of NFA states. Stage 7.

**Thompson's construction** - the standard method for building an eps-NFA from a
postfix regular expression, using a small fixed rule per operator. Stage 5.

**Token** - one meaningful unit of the expression. Here, always one character.

**Transition** - a labelled directed edge from one state to another. In the
data: `{ from, to, symbol }`, where `symbol: null` means epsilon.

**Trap state** - see _dead state_.

---

## Project-specific vocabulary

**Contract** - a shape or rule that crosses a module boundary and therefore
cannot be changed unilaterally. The contracts are in `src/compiler/types.ts` and
described in `DATA_CONTRACTS.md`.

**Adapter** - a function in `src/visualization/adapters/` that converts contract
types into graph nodes and edges. The only place in the visualization that knows
the contract shape.

**Fixture** - a hand-written mock automaton in `tests/fixtures/`. Conforms to
the contract; is not a specification of the compiler output.

**Pipeline** - the nine ordered stages from regular expression to simulation.
See `COMPILER_PIPELINE.md`.

**Public API** - what a module exports from its `index.ts`. The only thing other
modules may import. See `API_CONTRACT.md`.

**Shared file** - a file more than one person edits, listed in
`TEAM_WORKFLOW.md`. Changing one needs coordination.

**Step** - one stage of the pipeline as presented in the UI, with an id, a title
and a description. In the data: `CompilationStep`.
