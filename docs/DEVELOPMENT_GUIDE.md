# Development guide

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Start the app

```bash
npm install
npm run dev
```

Vite prints the local address. The application runs the compiler in the browser.

## Validate a change

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The compiler is split into single-purpose stages under `src/compiler/`. The public entry point is `compileRegex` in `src/compiler/index.ts`. Keep its output and the walkthrough stages focused on direct position-set construction; tests under `tests/compiler/` compare DFA acceptance against known cases and independent regular-expression oracles.
