# Faculty Demonstration Guide

**Target duration:** 5–8 minutes  
**Expression:** `(a|b)*abb`  
**Source-grounded status:** UI actions and labels below are present in source. This guide was not rehearsed in a browser; presenters should verify the actual display on the presentation machine.

## Opening (about 30 seconds)

“Regular expressions describe patterns, but the compiler steps that turn a pattern into a deterministic finite automaton are often hidden. DFA Visualizer is a browser-based teaching tool that exposes the syntax tree, position analysis, followpos table, direct DFA construction, minimization, and string simulation. Its compiler uses the direct syntax-tree construction, rather than building a Thompson ε-NFA and converting that NFA by subset construction.”

## Minute-by-minute plan

| Time      | Action                                                                                                                                             | Explain                                                                                                                                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:40 | Show the project title and **Regular expression** input.                                                                                           | State the educational problem and supported grammar.                                                                                                                                                                          |
| 0:40–1:30 | Enter `(a                                                                                                                                          | b)*abb` and press **Convert**.                                                                                                                                                                                                | `*` applies to the group `(a | b)`; implicit concatenation then appends `a`, `b`, `b`. This language consists of strings over `{a,b}`ending with`abb`. |
| 1:30–2:10 | Select **Tokenization**, **Explicit Concatenation**, then **Postfix Notation** in the compilation step navigation.                                 | The stages expose each representation. Explicit form is `(a                                                                                                                                                                   | b)*.a.b.b`; postfix is `ab   | *a.b.b.`. The dot is internal concatenation, not a wildcard.                                                            |
| 2:10–3:15 | Select **Syntax Tree & Positions**. Point to the syntax tree and the position/analysis tables.                                                     | The expression is augmented with `#`; leaves are numbered left-to-right. Explain nullable, firstpos, and lastpos briefly. The test suite verifies positions 1–6 for this example and root firstpos `{1,2,3}`.                 |
| 3:15–4:00 | Select **Followpos Table**.                                                                                                                        | Followpos records which leaf positions may immediately follow each position. At concatenation and star nodes the compiler applies their specific followpos rules. The resulting position sets drive DFA transitions.          |
| 4:00–5:00 | Select **Direct DFA Construction**. Identify start arrow, state labels, transitions and accepting double border.                                   | Start state is `firstpos(root)`. On a symbol, collect the followpos sets for matching positions. A state containing the `#` position is accepting. Missing edges mean rejection; the DFA is partial.                          |
| 5:00–5:40 | Select **Minimized DFA** and compare number/readability of states.                                                                                 | Partition refinement merges equivalent states while preserving language. For this expression, compiler tests verify both direct and minimized machines have four states. Do not claim a reduction occurred here.              |
| 5:40–7:15 | Select **String Simulation**. Enter `abb`, press **Run**; then change to `ab`, press **Run**. Use **Next**/**Prev** to explain trace highlighting. | `abb` is accepted because it ends in an accepting state after the whole string. `ab` is rejected because the required suffix is incomplete. Source tests also verify `aabb` and `babb` accepted and empty string rejected.    |
| 7:15–8:00 | Summarize implementation and checks; invite questions.                                                                                             | Mention TypeScript compiler, React interface, React Flow graph, and automated test suite. Be transparent that the project-wide formatting check currently fails on five files and keyboard tab navigation remains incomplete. |

If time is short, omit a detailed postfix explanation and show one accepted and one rejected string. Avoid typing `a.b`: the dot is reserved for internal output and user input is rejected.

## Exact UI actions and expected results

1. Click the **Regular expression** field, enter `(a|b)*abb`, and press **Convert**.
2. Select the step buttons **Explicit Concatenation**, **Postfix Notation**, **Syntax Tree & Positions**, **Followpos Table**, **Direct DFA Construction**, and **Minimized DFA** in that order. The actual buttons are generated from `result.steps` in `src/components/StepNavigation.tsx` and rendered in `src/pages/HomePage.tsx`.
3. Select **String Simulation**. Enter `abb` in **Input string** and click **Run**. Expected verdict: **✓ ACCEPTED**.
4. Enter `ab` in **Input string** and click **Run**. Expected verdict: **✗ REJECTED**. The expression requires the final `b` as well.
5. Optionally try `aabb` and `babb` (accepted), then `abba` or empty input (rejected). These exact language outcomes are listed in `tests/compiler/compiler.test.ts`.

The simulator has **Prev**, **Next**, and **Reset** controls for trace navigation. It supplies highlighted states and transitions to `DfaGraph`. A rejecting character with no transition is shown as `(no transition)` in the trace. The empty-string rejection message is specific: **The start state does not accept the empty string.**

## Explain the algorithm in one minute

“We first validate and tokenize the expression, insert an explicit concatenation operator, and use the shunting-yard algorithm to make postfix form. We build a syntax tree for the expression with an end marker `#`, then number its leaves. For each node we calculate nullable, firstpos, and lastpos. Followpos is derived from concatenation and Kleene-star nodes. The initial DFA state is the root's firstpos set. For each state and input symbol, we union followpos for positions carrying that symbol; each distinct sorted position set becomes one DFA state. A state is accepting if it includes the end-marker position. Finally, Moore-style partition refinement minimizes the DFA. Simulation walks this partial DFA and rejects at the first missing transition.”

### Terms for viva answers

- **NFA vs DFA:** An NFA may have multiple possible next states for an input (and may have epsilon transitions); a DFA has at most one next state for each state and input symbol. The active compiler here constructs the DFA directly, so it does not create an NFA as an intermediate.
- **Nullable:** True when a syntax-tree subtree can match the empty string.
- **Firstpos / lastpos:** Positions that can be the first / last consumed leaf in strings generated by a subtree.
- **Followpos:** Positions that may immediately follow a leaf position in a generated string.
- **Why `#`?** It marks the end of a complete match. Inclusion of its leaf position identifies DFA accepting states.
- **Minimization:** Combines states indistinguishable by any input string and removes unreachable/non-live states while preserving the language.

## Likely faculty viva questions

| Question                                                      | Concise answer                                                                                                                                                               |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What problem does the project solve?                          | It makes the compiler-design steps from a supported regular expression to a DFA visible and testable, rather than presenting only a final automaton.                         |
| Why React?                                                    | The interface is composed of stages and reusable components whose views update from application state.                                                                       |
| Why TypeScript?                                               | It gives compile-time checks for the shared `CompilationResult`, DFA, syntax-tree, and graph data contracts.                                                                 |
| What does Vite do?                                            | It runs the development server and creates the production bundle; the project's build script runs TypeScript first.                                                          |
| What does React Flow do?                                      | It provides the interactive graph canvas and node/edge framework; custom code maps automata to nodes, routes edges, and supplies layout.                                     |
| How is this different from Thompson plus subset construction? | The active algorithm uses syntax-tree leaf positions and followpos to construct DFA states directly; no ε-NFA or subset-conversion stage is executed by `compileRegex`.      |
| Why are position sets used as state identities?               | The direct construction defines a DFA state as a set of possible next symbol positions; canonical sorted sets let the compiler detect repeated states.                       |
| How are accepting states identified?                          | A state is accepting exactly when its position set includes the leaf position assigned to `#`.                                                                               |
| What if an edge is absent?                                    | The DFA is partial; a missing transition means reject. The simulator reports the stopping input index and trace.                                                             |
| What does minimization preserve?                              | It preserves the language while merging equivalent states and removing states that cannot contribute to acceptance.                                                          |
| What is tested?                                               | Compiler stages and language behavior, DFA invariants/equivalence, visualization adapters/layout/components, UI behavior, and app integration.                               |
| What are the main limitations?                                | The grammar is intentionally small; keyboard support for the step tablist is incomplete; some NFA compatibility code remains; the repository format check currently fails.   |
| How do you prove the example output?                          | The textbook verification test checks its position table, root firstpos/lastpos, followpos, exact direct-DFA transitions, accepting state, and equivalence/accepted strings. |

## Troubleshooting

- **App does not start:** From repository root, use `npm run dev` and open the local URL printed by Vite. Check that Node satisfies Vite's required version and that dependencies are already installed. Do not install or update packages immediately before presenting without team approval.
- **Blank page or error after pressing Convert:** Confirm the expression is exactly `(a|b)*abb` and check the visible error message. `.` cannot be entered as a user literal; use juxtaposition for concatenation.
- **An example appears wrong:** Try the verified strings `abb` (accepted) and `ab` (rejected). Recompile with **Convert** before opening simulation after changing the expression.
- **Graph looks clipped:** Use the graph's visible controls / React Flow viewport interaction to fit or pan/zoom. Rehearse the graph on the room display and a standard laptop viewport beforehand; responsive browser behavior was not manually verified for this guide.
- **Simulation trace appears stale:** Press **Run** again after editing **Input string**. Use **Reset** to clear the current trace.
- **Live demo cannot run:** Have a screenshot or short capture prepared by the team only after it has been manually captured and checked. Do not claim the browser was live-tested based solely on source/tests.

## Before-presentation checklist

- [ ] Team confirms names, individual contributions, review/test work, and presentation roles.
- [ ] Team confirms whether AI tools were used and prepares a disclosure consistent with institutional policy. Do not infer use/non-use from code style.
- [ ] On the presentation machine, run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`; record actual results and date.
- [ ] Review `npm run format:check`: it currently fails on five existing files (`docs/DECISIONS.md`, `docs/VISUALIZATION_SPEC.md`, `src/components/StringSimulator.tsx`, `src/visualization/components/AutomataGraph.tsx`, `src/visualization/components/SyntaxTreeGraph.tsx`). Decide whether to fix before submission and rerun the check.
- [ ] Start the app with `npm run dev`, open the printed local address, and rehearse all exact actions in this guide.
- [ ] Verify the window/projector scaling and graph fit in the actual presentation room. Test keyboard navigation honestly; source currently lacks full ARIA tablist keyboard behavior.
- [ ] Keep `(a|b)*abb`, accepted strings `abb`, `aabb`, `babb`, and rejected strings `ab`, `abba`, and empty input ready.
- [ ] Prepare answers on the active direct-DFA method, partial transitions, compatibility NFA code, automated test coverage, and unverified manual accessibility/responsive behavior.

## Repository evidence for this guide

- Workflow and stage names: `src/pages/HomePage.tsx`, `src/components/StepNavigation.tsx`, `src/components/RegexInput.tsx`, `src/components/StringSimulator.tsx`.
- Pipeline and supported syntax: `src/compiler/compiler.ts`, `src/compiler/directDfa.ts`, `src/compiler/validator.ts`, `src/compiler/minimizeDfa.ts`, `src/compiler/simulator.ts`.
- Example outputs and accepted/rejected strings: `tests/compiler/compiler.test.ts` (especially the textbook verification and language cases).
- Graph interaction: `src/visualization/components/AutomataGraph.tsx`, `TransitionEdge.tsx`, `DfaGraph.tsx`, and `src/visualization/layout/graphLayout.ts`.
- Commands: `package.json`; test configuration: `vite.config.ts`.
