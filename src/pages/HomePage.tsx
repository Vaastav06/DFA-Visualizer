/**
 * The single page of the application.
 *
 * OWNER: Person 3.
 *
 *   RegexInput + ExampleExpressions
 *        -> compile() from useAppContext()
 *        -> StepNavigation over result.steps
 *        -> StepContent for the active step
 *             postfix | <SyntaxTreeGraph /> + <PositionTable /> + <AstAnalysisTable />
 *                     | <FollowposTable />
 *                     | <DfaGraph /> + <TransitionTable /> + <DfaMapping />
 *                     | <DfaGraph kind="minimized-dfa" /> + <TransitionTable /> + <DfaMapping />
 *                     | <StringSimulator />
 */

import { useState, useEffect } from 'react';
import { ExampleExpressions } from '../components/ExampleExpressions';
import { RegexInput } from '../components/RegexInput';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { StepNavigation } from '../components/StepNavigation';
import { StepContent } from '../components/StepContent';
import { AlgorithmExplanation } from '../components/AlgorithmExplanation';
import { TokenList } from '../components/TokenList';
import { DfaGraph } from '../visualization';
import { SyntaxTreeGraph } from '../visualization';
import { FollowposTable } from '../visualization';
import { PositionTable } from '../visualization';
import { AstAnalysisTable } from '../visualization';
import { TransitionTable } from '../components/TransitionTable';
import { DfaMapping } from '../components/DfaMapping';
import { StringSimulator } from '../components/StringSimulator';
import { useAppContext } from '../context/AppContext';
import { PIPELINE_STEPS } from '../compiler';
import type { CompilationStepId } from '../compiler';

function explanationFor(stepId: CompilationStepId): string {
  switch (stepId) {
    case 'input':
      return 'The expression is validated for balanced groups, legal operators and a non-empty body before any construction runs.';
    case 'tokens':
      return 'The tokenizer scans left to right and splits the input into literals, operators and parentheses.';
    case 'concatenation':
      return 'Adjacent operands are joined with an explicit concatenation operator so the parser sees every application.';
    case 'postfix':
      return 'The shunting-yard algorithm rewrites the expression into postfix form, removing parentheses while preserving order of operations, so the parser can build a syntax tree.';
    case 'syntaxTree':
      return 'The expression is augmented with end-marker "#" and parsed into a syntax tree. Leaf positions are assigned left-to-right, and each node receives nullable, firstpos, and lastpos analysis.';
    case 'followpos':
      return 'The followpos table is computed from the syntax tree. For each position p with symbol s, followpos(p) contains the set of positions that can immediately follow p in some accepted string.';
    case 'dfa':
      return 'Direct DFA construction creates states from syntax-tree position sets using the followpos table. Each DFA state represents a unique subset of positions, and transitions are determined by which positions follow on each input symbol.';
    case 'minimized':
      return 'States are merged when no input string can tell them apart, leaving the smallest equivalent DFA.';
    case 'simulation':
      return 'The simulator walks the minimized DFA one symbol at a time and reports whether the run ends in an accepting state.';
    default:
      return '';
  }
}

function codeBlock(text: string) {
  return (
    <pre className="code-block">
      <code>{text}</code>
    </pre>
  );
}

export function HomePage() {
  const {
    expression,
    setExpression,
    compile,
    reset,
    result,
    error,
    isCompiling,
    activeStep,
    setActiveStep,
  } = useAppContext();

  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedDfaStateId, setSelectedDfaStateId] = useState<number | null>(null);
  const [selectedMinDfaStateId, setSelectedMinDfaStateId] = useState<number | null>(null);

  useEffect(() => {
    setSelectedNodeId(null);
    setSelectedPosition(null);
    setSelectedDfaStateId(null);
    setSelectedMinDfaStateId(null);
  }, [result]);

  const handleExpressionChange = (next: string) => {
    setExpression(next);
    if (error !== null) {
      reset();
    }
  };

  const handleExampleSelect = (exampleExpr: string) => {
    setExpression(exampleExpr);
    compile(exampleExpr);
  };

  const handleStepSelect = (stepId: string) => {
    setActiveStep(stepId as CompilationStepId);
  };

  const renderStepContent = () => {
    if (!result) return null;
    const step =
      result.steps.find((s) => s.id === activeStep) ??
      PIPELINE_STEPS.find((s) => s.id === activeStep) ??
      PIPELINE_STEPS[0];

    return (
      <>
        <StepContent step={step}>
          {activeStep === 'input' && codeBlock(result.input)}
          {activeStep === 'tokens' && <TokenList tokens={result.tokens} />}
          {activeStep === 'concatenation' && codeBlock(result.explicitConcatenation)}
          {activeStep === 'postfix' && (
            <>
              {codeBlock(result.explicitConcatenation)}
              {codeBlock(result.postfix)}
            </>
          )}
          {activeStep === 'syntaxTree' && (
            <>
              <SyntaxTreeGraph
                tree={result.syntaxTree}
                selectedNodeId={selectedNodeId}
                highlightedPositions={selectedPosition !== null ? [selectedPosition] : undefined}
                onNodeClick={(nodeId, data) => {
                  setSelectedNodeId(nodeId);
                  if (data.position !== undefined) {
                    setSelectedPosition(data.position);
                  }
                }}
              />
              <PositionTable
                positions={result.positions}
                highlightedPosition={selectedPosition}
                onSelectPosition={(pos) => setSelectedPosition(pos)}
              />
              <AstAnalysisTable
                tree={result.syntaxTree}
                selectedNodeId={selectedNodeId}
                onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
              />
            </>
          )}
          {activeStep === 'followpos' && (
            <FollowposTable
              followpos={result.followpos}
              selectedPosition={selectedPosition}
              onSelectPosition={(pos) => setSelectedPosition(pos)}
            />
          )}
          {activeStep === 'dfa' && (
            <div className="stage-graph">
              <DfaGraph
                dfa={result.dfa}
                selectedStateId={selectedDfaStateId}
                onStateClick={(id) => setSelectedDfaStateId(id)}
              />
              <div className="table-scroll">
                <TransitionTable dfa={result.dfa} />
              </div>
              <div className="table-scroll">
                <DfaMapping dfa={result.dfa} />
              </div>
            </div>
          )}
          {activeStep === 'minimized' && (
            <div className="stage-graph">
              <DfaGraph
                dfa={result.minimizedDfa}
                kind="minimized-dfa"
                selectedStateId={selectedMinDfaStateId}
                onStateClick={(id) => setSelectedMinDfaStateId(id)}
              />
              <div className="table-scroll">
                <TransitionTable
                  dfa={result.minimizedDfa}
                  caption="Minimized DFA transition table"
                />
              </div>
              <div className="table-scroll">
                <DfaMapping dfa={result.minimizedDfa} caption="Minimized DFA state mapping" />
              </div>
            </div>
          )}
          {activeStep === 'simulation' && <StringSimulator dfa={result.minimizedDfa} />}
        </StepContent>
        <AlgorithmExplanation title={step.title}>
          {explanationFor(step.id as CompilationStepId)}
        </AlgorithmExplanation>
      </>
    );
  };

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">Regular Expression to DFA Visualizer</h1>
        <p className="page__subtitle">
          Enter a regular expression and follow it through tokenization, syntax-tree analysis,
          followpos, direct DFA construction and minimization.
        </p>
      </header>

      <section className="page__input">
        <RegexInput
          value={expression}
          onChange={handleExpressionChange}
          onSubmit={compile}
          disabled={isCompiling}
          hasError={error !== null}
          errorId="regex-error-message"
        />
        <ExampleExpressions onSelect={handleExampleSelect} />
      </section>

      <ErrorDisplay id="regex-error-message" message={error} onDismiss={reset} />

      <section className="page__results">
        {isCompiling && <LoadingState />}
        {!isCompiling && result === null && error === null && <EmptyState />}
        {!isCompiling && result !== null && (
          <div className="results-layout">
            <aside className="results__sidebar">
              <StepNavigation
                steps={result.steps}
                activeStepId={activeStep}
                onSelect={handleStepSelect}
              />
            </aside>
            <div className="results__main">{renderStepContent()}</div>
          </div>
        )}
      </section>

      <footer className="page__footer">
        <p>Compiler Design team project — see docs/ for the architecture and contracts.</p>
      </footer>
    </main>
  );
}
