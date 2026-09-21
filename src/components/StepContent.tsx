/**
 * The panel for the currently selected pipeline step.
 *
 * OWNER: Person 3.
 * TODO(Person 3): switch on the step id and render the postfix string, the
 * <NfaGraph />, the <DfaGraph />, the tables and the simulator.
 *
 * This is where the compiler, the visualization and the UI meet — see
 * docs/INTEGRATION_GUIDE.md.
 */

import type { ReactNode } from 'react';
import type { CompilationStep } from '../compiler';

interface StepContentProps {
  step: CompilationStep;
  children?: ReactNode;
}

export function StepContent({ step, children }: StepContentProps) {
  return (
    <section
      className="step-content"
      role="tabpanel"
      id={`step-panel-${step.id}`}
      aria-labelledby={`step-tab-${step.id}`}
    >
      <h2 className="step-content__title">{step.title}</h2>
      <p className="step-content__description">{step.description}</p>
      <div className="step-content__body">{children}</div>
    </section>
  );
}
