/**
 * Tabs/steps for moving through the compilation pipeline.
 *
 * Supports full WAI-ARIA tablist keyboard navigation (ArrowLeft, ArrowRight,
 * ArrowUp, ArrowDown, Home, End) and roving tabIndex per docs/UI_UX_SPEC.md.
 */

import { useRef, type KeyboardEvent } from 'react';
import type { CompilationStep } from '../compiler';

interface StepNavigationProps {
  steps: readonly CompilationStep[];
  activeStepId: string;
  onSelect?: (stepId: string) => void;
}

export function StepNavigation({ steps, activeStepId, onSelect }: StepNavigationProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (steps.length === 0) return;

    let nextIndex: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (index + 1) % steps.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (index - 1 + steps.length) % steps.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = steps.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const targetStep = steps[nextIndex];
    if (targetStep) {
      onSelect?.(targetStep.id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <nav className="step-nav" aria-label="Compilation steps">
      <ol className="step-nav__list" role="tablist" aria-orientation="vertical">
        {steps.map((step, index) => {
          const isSelected = step.id === activeStepId;
          return (
            <li key={step.id} role="presentation">
              <button
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`step-tab-${step.id}`}
                aria-selected={isSelected}
                aria-controls={`step-panel-${step.id}`}
                tabIndex={isSelected ? 0 : -1}
                className={`step-nav__item${isSelected ? ' step-nav__item--active' : ''}`}
                onClick={() => onSelect?.(step.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <span className="step-nav__index">{index + 1}</span>
                <span className="step-nav__title">{step.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
