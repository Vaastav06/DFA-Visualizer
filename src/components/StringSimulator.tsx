/**
 * Runs a test string against the DFA and shows the trace.
 *
 * OWNER: Person 3.
 * TODO(Person 3): call `simulate(dfa, input)` from `@/compiler`, render the
 * accept/reject verdict and step through `SimulationResult.steps`, passing a
 * `highlight` prop down to <DfaGraph /> as the animation advances.
 *
 * Rejection is a normal result, not an error — do not route it through
 * <ErrorDisplay />.
 */

import { useState } from 'react';
import type { DFA } from '../compiler';

interface StringSimulatorProps {
  dfa: DFA | null;
}

export function StringSimulator({ dfa }: StringSimulatorProps) {
  const [input, setInput] = useState('');

  if (dfa === null) {
    return null;
  }

  return (
    <section className="simulator" aria-labelledby="simulator-heading">
      <h3 id="simulator-heading">Test a string</h3>
      <label className="simulator__label" htmlFor="simulator-input">
        Input string
      </label>
      <input
        id="simulator-input"
        className="simulator__field"
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      {/* TODO(Person 3): Run button, verdict and step-by-step trace. */}
    </section>
  );
}
