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
import { DEAD_STATE_ID, DfaGraph } from '../visualization';
import { formatStateId } from '../hooks/useCompiler';

interface StringSimulatorProps {
  dfa: DFA | null;
}

export function StringSimulator({ dfa }: StringSimulatorProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(800);
  const [showDeadState, setShowDeadState] = useState(true);

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
      const simResult = simulate(dfa, input);
      setResult(simResult);
      setCurrentStep(0);
      // Automatically advance through steps when running simulation
      setIsPlaying(simResult.steps.length > 1);
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
    }, speed);

    return () => clearTimeout(timer);
  }, [isPlaying, result, currentStep, speed]);

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
    const targetState = step.toState !== null ? step.toState : showDeadState ? DEAD_STATE_ID : null;
    return {
      states: [step.fromState, targetState ?? step.fromState].filter(
        (s): s is number => s !== null
      ),
      transitions:
        targetState !== null
          ? [{ from: step.fromState, to: targetState, symbol: step.symbol }]
          : [],
    };
  }, [result, currentStep, dfa, showDeadState]);

  const activeStateId = useMemo(() => {
    if (!result) return undefined;
    if (result.steps.length === 0) {
      return dfa?.startState ?? 0;
    }
    const step = result.steps[currentStep];
    if (!step) return undefined;
    if (step.toState !== null) return step.toState;
    return showDeadState ? DEAD_STATE_ID : step.fromState;
  }, [result, currentStep, dfa, showDeadState]);

  const nextStep = useCallback(() => {
    setIsPlaying(false);
    if (result && currentStep < result.steps.length - 1) {
      setCurrentStep((c) => c + 1);
    }
  }, [result, currentStep]);

  const prevStep = useCallback(() => {
    setIsPlaying(false);
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
                {result.steps.map((step, index) => {
                  const isCurrent = index === currentStep;
                  const isRejectedStep = step.toState === null;
                  const itemClass = [
                    isCurrent ? 'current' : '',
                    isCurrent && isRejectedStep ? 'current--rejected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <li
                      key={`${step.index}-${step.fromState}-${step.symbol}`}
                      className={itemClass}
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentStep(index);
                      }}
                      style={{ cursor: 'pointer' }}
                      title={`Jump to step ${index + 1}`}
                    >
                      <span className="step-index">Step {index + 1}</span>
                      <span className="step-detail">
                        {formatStateId(step.fromState)} <span className="arrow">→</span>{' '}
                        {step.symbol} <span className="arrow">→</span>{' '}
                        {step.toState !== null ? (
                          formatStateId(step.toState)
                        ) : showDeadState ? (
                          <span className="step-dead">
                            {formatStateId(DEAD_STATE_ID)}{' '}
                            <span className="step-dead-badge">(trap state)</span>
                          </span>
                        ) : (
                          '(no transition)'
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>

              <div className="simulator__controls">
                <span className="simulator__progress-indicator" aria-live="polite">
                  Step {currentStep + 1} of {result.steps.length}
                </span>
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
                <button
                  type="button"
                  className={`button button--secondary ${showDeadState ? 'button--active' : ''}`}
                  onClick={() => setShowDeadState((p) => !p)}
                  aria-pressed={showDeadState}
                  title="Toggle visual trap / dead state display (qd)"
                >
                  {showDeadState ? 'Hide Trap State' : 'Trap State (qd)'}
                </button>
                <div className="simulator__speed-control">
                  <label htmlFor="simulator-speed" className="simulator__speed-label">
                    Speed:
                  </label>
                  <select
                    id="simulator-speed"
                    className="simulator__speed-select"
                    value={speed}
                    onChange={(event) => setSpeed(Number(event.target.value))}
                    aria-label="Playback speed"
                  >
                    <option value={1400}>0.5x</option>
                    <option value={800}>1x</option>
                    <option value={400}>2x</option>
                  </select>
                </div>
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
              <button
                type="button"
                className={`button button--secondary ${showDeadState ? 'button--active' : ''}`}
                onClick={() => setShowDeadState((p) => !p)}
                aria-pressed={showDeadState}
                title="Toggle visual trap / dead state display (qd)"
              >
                {showDeadState ? 'Hide Trap State' : 'Trap State (qd)'}
              </button>
            </div>
          )}

          <div className="simulator__graph">
            <DfaGraph
              dfa={dfa}
              kind="minimized-dfa"
              highlight={highlight}
              activeStateId={activeStateId}
              showDeadState={showDeadState}
              height={360}
            />
          </div>
        </div>
      )}

      {!result && (
        <div className="simulator__graph">
          <DfaGraph dfa={dfa} kind="minimized-dfa" showDeadState={showDeadState} height={360} />
        </div>
      )}
    </section>
  );
}
