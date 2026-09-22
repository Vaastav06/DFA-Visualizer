import type { CompilationStep, CompilationStepId } from '../compiler';

interface StepNavigationProps {
  steps: readonly CompilationStep[];
  activeStepId: CompilationStepId;
  onSelect?: (stepId: CompilationStepId) => void;
}

export function StepNavigation({ steps, activeStepId, onSelect }: StepNavigationProps) {
  return (
    <nav className="step-nav" aria-label="Compilation steps">
      <ol className="step-nav__list" role="tablist">
        {steps.map((step, index) => (
          <li key={step.id}>
            <button
              type="button"
              role="tab"
              id={`step-tab-${step.id}`}
              aria-selected={step.id === activeStepId}
              aria-controls={`step-panel-${step.id}`}
              className={`step-nav__item${step.id === activeStepId ? ' step-nav__item--active' : ''}`}
              onClick={() => onSelect?.(step.id as CompilationStepId)}
            >
              <span className="step-nav__index">{index + 1}</span>
              <span className="step-nav__title">{step.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
