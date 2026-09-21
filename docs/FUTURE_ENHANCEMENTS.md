# Future Enhancements

Ideas deliberately left out of v1. Nothing here is committed work - the list
exists so good ideas are recorded rather than half-built.

Before starting any of these: v1 must be complete, tested and demonstrable.

---

## Regex syntax

**Plus and question-mark operators.** Both are sugar (`a+` is `a.a*`, `a?` is
`a|eps`). Cheapest real extension. See D-009 and the checklist in
`REGEX_SPECIFICATION.md`.

**Character classes.** `[a-z]` expands to an alternation. Needs a range parser
and makes the alphabet much larger, which stresses the graph layout - worth
doing only after merged-edge rendering is proven.

**Escape sequences.** `\*` to match a literal asterisk. Needs an escape
mechanism in the tokenizer and a decision about what `\` means. It also frees
`.` to mean "any character", which would remove the one surprising thing about
the current syntax.

**Bounded repetition.** `a{2,4}`. Expands to concatenations; easy to implement,
easy to produce an enormous NFA with.

---

## Visualization

**Animated construction.** Watch Thompson's construction build the NFA fragment
by fragment as the postfix string is consumed. Probably the single highest-value
idea here for the teaching goal.

**Side-by-side comparison.** The DFA and the minimized DFA in one view, with the
merged states linked. Makes minimization click faster than two separate graphs.

**Export as PNG or SVG.** Students would use this for reports. React Flow can
render to an image with some work.

**Manual node positioning.** Let the user drag nodes and keep the positions.
Useful for a screenshot; must not break the deterministic default layout.

**Automatic edge-crossing reduction.** A proper layered layout with crossing
minimisation. Only worth it once large expressions are common.

---

## Simulation

**NFA simulation.** Run a string through the eps-NFA showing the set of active
states at each step. Demonstrates non-determinism directly, and makes the reason
for subset construction obvious.

**Step backwards.** The trace is already fully recorded, so this is a UI
feature, not an algorithm one.

**Batch testing.** Paste a list of strings, see accept/reject for each. Useful
for checking an automaton against a spec.

**Generate matching strings.** Walk the DFA to produce example strings the
language accepts. Good for building intuition about what an expression means.

---

## Application

**Shareable URLs.** Put the expression in the query string so a link reproduces
a view. Small change, disproportionately useful for a group assignment.

**Save and load.** Keep recent expressions in `localStorage`.

**Comparison mode.** Two expressions side by side, with an answer to whether
they describe the same language - decidable by minimizing both and checking for
isomorphism. That is a genuinely interesting piece of theory to implement.

**Print stylesheet.** Automata and tables that print cleanly for a report.

**Guided tour.** A first-run walkthrough of the pipeline.

---

## Engineering

**Coverage reporting.** `@vitest/coverage-v8` plus a threshold. Deliberately
left out of v1 so effort goes to algorithm tests rather than to the percentage.

**CI.** Run lint, typecheck, test and build on every push. Worth adding the
moment more than one branch is in flight.

**Property-based testing.** Generate random expressions, then check that the
NFA, the DFA and the minimized DFA all accept exactly the same strings. That
single property catches more real bugs than any number of hand-written cases.

**Performance work.** Nothing here is slow at course scale. If a pathological
expression ever matters, subset construction is the place to look.

**Error recovery.** Report every syntax error rather than stopping at the first,
the way a real compiler does. A nice parallel to the course material.

---

## Not recommended

**A backend.** Everything runs in the browser and should stay that way.

**A general regex engine.** Backreferences and lookaround are not regular, so
they cannot be shown as a DFA. Adding them would contradict what the app
teaches.

**A UI component library.** The app has about a dozen components. A library
would be more configuration than code.

**Server-side rendering.** No benefit for a tool that is pure client-side
computation.
