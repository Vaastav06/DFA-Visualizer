# Git Workflow

## Branches

```text
main                      always stable, always builds, always passes tests
├── feature/compiler-core      Person 1
├── feature/visualization      Person 2
└── feature/ui                 Person 3
```

`main` is protected by convention: **no direct commits**. Everything arrives
through a branch and a review.

Create your branch once, at the start:

```bash
git checkout main
git pull
git checkout -b feature/compiler-core
```

For a self-contained piece of work, branch off your feature branch:

```bash
git checkout -b feature/compiler-core-minimization
```

Short-lived branches merge cleanly. A branch that lives for two weeks does not.

## Commit messages

```text
<area>: <what changed, imperative mood>

<why, if it is not obvious>
```

Areas: `compiler`, `visualization`, `ui`, `docs`, `test`, `config`, `chore`.

Good:

```text
compiler: implement subset construction

Uses a Map keyed by the sorted state set so a subset already seen is
found in one lookup rather than a linear scan.
```

```text
visualization: merge parallel transitions into one edge

Four symbols between the same two states produced four overlapping
curves. They now render as a single edge labelled "a, b, c, d".
```

Bad:

```text
fix
update files
WIP
asdf
```

A commit message is written for the person who runs `git blame` in three weeks.
That person is usually you.

## Commit size

One logical change per commit. If the message needs the word "and", it is
probably two commits.

Commit often on your own branch - a half-finished algorithm with a clear message
is fine there. Squash or tidy before merging if the history got messy.

## Daily rhythm

```bash
# start of a session
git checkout feature/ui
git pull origin main --rebase     # stay close to main

# ... work ...

npm run lint && npm run typecheck && npm test && npm run build

git add -A
git commit -m "ui: add transition table rendering"
git push origin feature/ui
```

Rebasing on `main` daily is what keeps conflicts to single lines instead of
whole files.

## Merging into main

1. Make sure your branch is current with `main`.
2. Run all four checks locally.
3. Open a pull request. Describe what changed and why; say explicitly if a
   shared file or a contract changed.
4. Get one review.
5. Merge.
6. Tell the others in the channel if you touched anything shared.

## Conflicts

Conflicts in your own area should be rare - you are the only one editing it. If
you get one, it usually means someone strayed out of their lane, and that is
worth a conversation rather than a silent resolution.

Conflicts in shared files are expected. Resolve them **deliberately**:

- Read both sides. Understand what the other person was doing.
- Never take "ours" or "theirs" wholesale to make the conflict go away - that is
  how a teammate work silently disappears.
- In `src/compiler/types.ts`, stop and talk to the other person. A conflict
  there means two people changed the contract.
- After resolving, run all four checks before committing the merge.

## Things not to commit

`.gitignore` covers the usual suspects. Beyond it:

- `node_modules/`, `dist/`, `coverage/`
- editor settings that are personal rather than project-wide
- commented-out code - git already remembers it
- `console.log` left in from debugging (the lint rule warns)
- secrets of any kind - this project has none, keep it that way

## If something breaks main

It happens. Tell the team first, then fix forward with a small commit. Revert
only if the fix is not obvious within a few minutes:

```bash
git revert <sha>
```

Reverting is not an admission of anything. A broken `main` blocks two other
people, which is far more expensive than a revert commit in the history.
