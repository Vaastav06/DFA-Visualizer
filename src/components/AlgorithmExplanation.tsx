/**
 * Prose explaining the algorithm behind the current step.
 *
 * OWNER: Person 3.
 * Sourced from docs/COMPILER_PIPELINE.md so the app and the docs agree.
 */

import type { ReactNode } from 'react';

interface AlgorithmExplanationProps {
  title: string;
  children?: ReactNode;
}

export function AlgorithmExplanation({ title, children }: AlgorithmExplanationProps) {
  return (
    <aside className="algorithm-explanation" aria-label={`How ${title} works`}>
      <h3 className="algorithm-explanation__title">How this works</h3>
      <div className="algorithm-explanation__body">{children}</div>
    </aside>
  );
}
