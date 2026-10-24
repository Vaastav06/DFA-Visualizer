/**
 * The panel for the currently selected pipeline step.
 *
 * OWNER: Person 3.
 * Renders the title, description, and children for the active compilation step.
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
