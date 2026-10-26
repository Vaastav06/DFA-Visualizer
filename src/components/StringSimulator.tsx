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
 * <ErrorDisplay />.
 */

import { useState, useCallback, useMemo, useEffect, type FormEvent } from 'react';
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
  const [isPlaying, setIsPlaying] = useState(false);

  // Clear stale simulation results whenever the DFA changes
  useEffect(() => {
    setIsPlaying(false);
    setResult(null);
    setCurrentStep(0);
  }, [dfa]);

  const runSimulation = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();
      if (!dfa) return;
      setIsPlaying(false);
      const simResult = simulate(dfa, input);
      setResult(simResult);
      setCurrentStep(0);
    },
    [dfa, input]
  );

  useEffect(() => {
    if (!isPlaying || !result || currentStep >= result.steps.length - 1) {
      if (isPlaying) setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((c) => {
        if (c < result.steps.length - 1) {
          return c + 1;
        }
        setIsPlaying(false);
        return c;
      });
    }, 900);

    return () => clearTimeout(timer);
  }, [isPlaying, result, currentStep]);

  const togglePlay = useCallback(() => {
    if (!result || result.steps.length === 0) return;
    if (currentStep >= result.steps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [result, currentStep]);

  const highlight = useMemo(() => {
    if (!result) return undefined;
    if (result.steps.length === 0) {
      return {
        states: [dfa?.startState ?? 0],
        transitions: [],
      };
    }
    const step = result.steps[currentStep];
    if (!step) return undefined;
    return {
      states: [step.fromState, step.toState ?? step.fromState].filter(
        (s): s is number => s !== null
      ),
      transitions:
        step.toState !== null
          ? [{ from: step.fromState, to: step.toState, symbol: step.symbol }]
          : [],
    };
  }, [result, currentStep, dfa]);

  const activeStateId = useMemo(() => {
    if (!result) return undefined;
    if (result.steps.length === 0) {
      return dfa?.startState ?? 0;
    }
    const step = result.steps[currentStep];
    if (!step) return undefined;
    return step.toState ?? step.fromState;
  }, [result, currentStep, dfa]);

  const nextStep = useCallback(() => {
    if (result && currentStep < result.steps.length - 1) {
      setCurrentStep((c) => c + 1);
    }
  }, [result, currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((c) => c - 1);
    }
  }, [currentStep]);

  const resetSimulation = useCallback(() => {
    setIsPlaying(false);
    setResult(null);
    setCurrentStep(0);
  }, []);

  if (dfa === null) {
    return null;
  }

  return (
    <section className="simulator" aria-labelledby="simulator-heading">
      <h3 id="simulator-heading">Test a string</h3>

      <form className="simulator__input-group" onSubmit={runSimulation}>
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
          <button type="submit" className="button button--primary simulator__run">
            Run
          </button>
        </div>
      </form>

      {result && (
        <div className="simulator__result">
          <div
            className={`simulator__verdict simulator__verdict--${result.accepted ? 'accepted' : 'rejected'}`}
            role="status"
            aria-live="polite"
          >
            {result.accepted ? '✓ ACCEPTED' : '✗ REJECTED'}
          </div>

          {result.error && <p className="simulator__note">{result.error}</p>}

          {result.steps.length > 0 && (
            <div className="simulator__trace">
              <h4>Execution trace</h4>
              <ol className="simulator__steps">
                {result.steps.map((step, index) => (
                  <li
                    key={`${step.index}-${step.fromState}-${step.symbol}`}
                    className={index === currentStep ? 'current' : ''}
                  >
                    <span className="step-index">Step {index + 1}</span>
                    <span className="step-detail">
                      {formatStateId(step.fromState)} <span className="arrow">→</span> {step.symbol}{' '}
                      <span className="arrow">→</span>{' '}
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
                  onClick={togglePlay}
                  aria-label={
                    isPlaying ? 'Pause simulation animation' : 'Play simulation animation'
                  }
                >
                  {isPlaying ? 'Pause' : 'Play'}
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
                  onClick={resetSimulation}
                  aria-label="Reset simulation"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {result.steps.length === 0 && (
            <div className="simulator__controls">
              <button
                type="button"
                className="button button--secondary"
                onClick={resetSimulation}
                aria-label="Reset simulation"
              >
                Reset
              </button>
            </div>
          )}

          <div className="simulator__graph">
            <DfaGraph
              dfa={dfa}
              kind="minimized-dfa"
              highlight={highlight}
              activeStateId={activeStateId}
              height={360}
            />
          </div>
        </div>
      )}

      {!result && (
        <div className="simulator__graph">
          <DfaGraph dfa={dfa} kind="minimized-dfa" height={360} />
        </div>
      )}
    </section>
  );
}
