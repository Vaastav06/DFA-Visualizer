/**
 * The single page of the application.
 *
 * OWNER: Person 3.
 * TODO(Person 3): build the real layout —
 *
 *   RegexInput + ExampleExpressions
 *        -> compile() from useAppContext()
 *        -> StepNavigation over result.steps
 *        -> StepContent for the active step
 *             postfix | <NfaGraph /> + <NfaTable />
 *                     | <DfaGraph /> + <TransitionTable /> + <DfaMapping />
 *                     | <DfaGraph kind="minimized-dfa" />
 *                     | <StringSimulator />
 *
 * Until the compiler exists, `compile()` throws a "not implemented" error which
 * the hook turns into a message in <ErrorDisplay /> — that is expected, and it
 * proves the wiring is real.
 */

import { ExampleExpressions } from '../components/ExampleExpressions';
import { RegexInput } from '../components/RegexInput';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useAppContext } from '../context/AppContext';

export function HomePage() {
  const { expression, setExpression, compile, reset, result, error, isCompiling } = useAppContext();

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">Regular Expression to DFA Visualizer</h1>
        <p className="page__subtitle">
          Enter a regular expression and follow it through tokenization, postfix conversion,
          Thompson&apos;s construction, subset construction and minimization.
        </p>
      </header>

      <section className="page__input">
        <RegexInput
          value={expression}
          onChange={setExpression}
          onSubmit={compile}
          disabled={isCompiling}
        />
        <ExampleExpressions onSelect={setExpression} />
      </section>

      <ErrorDisplay message={error} onDismiss={reset} />

      <section className="page__results">
        {isCompiling && <LoadingState />}
        {!isCompiling && result === null && error === null && <EmptyState />}
        {!isCompiling && result !== null && (
          /* TODO(Person 3): StepNavigation + StepContent go here. */
          <p className="page__placeholder">
            Compiled <code>{result.input}</code> — step views are not built yet.
          </p>
        )}
      </section>

      <footer className="page__footer">
        <p>Compiler Design team project — see docs/ for the architecture and contracts.</p>
      </footer>
    </main>
  );
}
