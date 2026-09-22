/**
 * The single page of the application.
 *
 * OWNER: Person 3.
 *
 *   RegexInput + ExampleExpressions
 *        -> compile() from useAppContext()
 *        -> StepNavigation over result.steps
 *        -> StepContent for the active step
 *             postfix | <NfaGraph /> + <NfaTable />
 *                     | <DfaGraph /> + <TransitionTable /> + <DfaMapping />
 *                     | <DfaGraph kind="minimized-dfa" />
 *                     | <StringSimulator />
 */

import { ExampleExpressions } from '../components/ExampleExpressions';
import { RegexInput } from '../components/RegexInput';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { StepNavigation } from '../components/StepNavigation';
import { StepContent } from '../components/StepContent';
import { TransitionTable } from '../components/TransitionTable';
import { NfaTable } from '../components/NfaTable';
import { DfaMapping } from '../components/DfaMapping';
import { StringSimulator } from '../components/StringSimulator';
import { NfaGraph } from '../visualization';
import { DfaGraph } from '../visualization';
import { useAppContext } from '../context/AppContext';
import { PIPELINE_STEPS } from '../compiler';
import type { CompilationStepId } from '../compiler';

export function HomePage() {
  const { expression, setExpression, compile, reset, result, error, isCompiling, activeStep, setActiveStep } = useAppContext();

  const handleStepSelect = (stepId: CompilationStepId) => {
    setActiveStep(stepId);
  };

  const renderStepContent = () => {
    if (!result) return null;

    switch (activeStep) {
      case 'input':
        return (
          <StepContent step={PIPELINE_STEPS[0]}>
            <pre className="code-block"><code>{result.input}</code></pre>
          </StepContent>
        );
      case 'tokens':
        return (
          <StepContent step={PIPELINE_STEPS[1]}>
            <ul className="token-list">
              {result.tokens.map((token, i) => (
                <li key={i}><code>{token}</code></li>
              ))}
            </ul>
          </StepContent>
        );
      case 'concatenation':
        return (
          <StepContent step={PIPELINE_STEPS[2]}>
            <pre className="code-block"><code>{result.explicitConcatenation}</code></pre>
          </StepContent>
        );
      case 'postfix':
        return (
          <StepContent step={PIPELINE_STEPS[3]}>
            <pre className="code-block"><code>{result.postfix}</code></pre>
          </StepContent>
        );
      case 'nfa':
        return (
          <StepContent step={PIPELINE_STEPS[4]}>
            <NfaGraph nfa={result.nfa} height={400} />
            <NfaTable nfa={result.nfa} />
          </StepContent>
        );
      case 'dfa':
        return (
          <StepContent step={PIPELINE_STEPS[5]}>
            <DfaGraph dfa={result.dfa} height={400} />
            <TransitionTable dfa={result.dfa} />
            <DfaMapping dfa={result.dfa} />
          </StepContent>
        );
      case 'minimized':
        return (
          <StepContent step={PIPELINE_STEPS[6]}>
            <DfaGraph dfa={result.minimizedDfa} kind="minimized-dfa" height={400} />
            <TransitionTable dfa={result.minimizedDfa} caption="Minimized DFA transition table" />
            <DfaMapping dfa={result.minimizedDfa} caption="Minimized DFA state mapping" />
          </StepContent>
        );
      case 'simulation':
        return (
          <StepContent step={PIPELINE_STEPS[7]}>
            <StringSimulator dfa={result.minimizedDfa} />
          </StepContent>
        );
      default:
        return null;
    }
  };

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
          <div className="results-layout">
            <aside className="results__sidebar">
              <StepNavigation
                steps={PIPELINE_STEPS}
                activeStepId={activeStep}
                onSelect={handleStepSelect}
              />
            </aside>
            <div className="results__main">
              {renderStepContent()}
            </div>
          </div>
        )}
      </section>

      <footer className="page__footer">
        <p>Compiler Design team project — see docs/ for the architecture and contracts.</p>
      </footer>
    </main>
  );
}
