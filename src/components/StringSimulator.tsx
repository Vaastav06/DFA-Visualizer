/**
 * Runs a test string against the DFA and shows the trace.
 *
 * OWNER: Person 3.
 *
 * Calls `simulate(dfa, input)` from `@/compiler`, renders the
 * accept/reject verdict and step-through trace, passing a
 * `highlight` prop down to `<DfaGraph />` as the animation advances.
 *
 * Rejection is a normal result, not an error — do not route it through
 * `<ErrorDisplay />`.
 */

import { useState, useCallback, useMemo } from 'react';
import { simulate, type DFA, type SimulationResult } from '../compiler';
import { DfaGraph } from '../visualization';
import { formatStateId } from '../hooks/useCompiler';

interface StringSimulatorProps {
  dfa: DFA | null;
}

export function StringSimulator({ dfa }: StringSimulatorProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const runSimulation = useCallback(() => {
    if (!dfa) return;
    const simResult = simulate(dfa, input);
    setResult(simResult);
    setCurrentStep(0);
  }, [dfa, input]);

  const highlight = useMemo(() => {
    if (!result || result.steps.length === 0) return undefined;
    const step = result.steps[currentStep];
    if (!step) return undefined;
    return {
      states: [step.fromState, step.toState ?? step.fromState].filter((s): s is number => s !== null),
      transitions: step.toState !== null ? [{ from: step.fromState, to: step.toState, symbol: step.symbol }] : [],
    };
  }, [result, currentStep]);

  const nextStep = useCallback(() => {
    if (result && currentStep < result.steps.length - 1) {
      setCurrentStep(c => c + 1);
    }
  }, [result, currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(c => c - 1);
    }
  }, [currentStep]);

  const resetSimulation = useCallback(() => {
    setResult(null);
    setCurrentStep(0);
    setIsAnimating(false);
  }, []);

  const toggleAnimation = useCallback(() => {
    if (!result) return;
    setIsAnimating(!isAnimating);
  }, [result, isAnimating]);

  // Auto-advance animation
  // (in a real app, use useEffect with interval; keeping simple for now)

  if (dfa === null) {
    return null;
  }

  return (
    <section className="simulator" aria-labelledby="simulator-heading">
      <h3 id="simulator-heading">Test a string</h3>
      
      <div className="simulator__input-group">
        <label className="simulator__label" htmlFor="simulator-input">
          Input string
        </label>
        <div className="simulator__field-row">
          <input
            id="simulator-input"
            className="simulator__field"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="e.g. abb"
          />
          <button
            type="button"
            className="button button--primary simulator__run"
            onClick={runSimulation}
            disabled={isAnimating}
          >
            Run
          </button>
        </div>
      </div>

      {result && (
        <div className="simulator__result">
          <div className={`simulator__verdict ${result.accepted ? 'accepted' : 'rejected'}`}>
            {result.accepted ? '✓ ACCEPTED' : '✗ REJECTED'}
          </div>

          {result.steps.length > 0 && (
            <div className="simulator__trace">
              <h4>Execution trace</h4>
              <ol className="simulator__steps">
                {result.steps.map((step, index) => (
                  <li key={index} className={index === currentStep ? 'current' : ''}>
                    <span className="step-index">Step {index + 1}</span>
                    <span className="step-detail">
                      {formatStateId(step.fromState)}
                      {' '}
                      <span className="arrow">→</span>
                      {' '}
                      {step.symbol}
                      {' '}
                      <span className="arrow">→</span>
                      {' '}
                      {step.toState !== null ? formatStateId(step.toState) : '(no transition)'}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="simulator__controls">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  aria-label="Previous step"
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={nextStep}
                  disabled={currentStep >= result.steps.length - 1}
                  aria-label="Next step"
                >
                  Next
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={toggleAnimation}
                  disabled={result.steps.length <= 1}
                  aria-label={isAnimating ? 'Pause animation' : 'Play animation'}
                >
                  {isAnimating ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={resetSimulation}
                  aria-label="Reset simulation"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {result.rejectedAt !== undefined && result.steps.length === 0 && (
            <p className="simulator__rejected-note">
              Rejected at position {result.rejectedAt}: input string is empty but start state is not accepting.
            </p>
          )}
        </div>
      )}

      {/* DFA Graph with highlight */}
      <DfaGraph
        dfa={dfa}
        kind="dfa"
        highlight={highlight}
        height={400}
      />
    </section>
  );
}
