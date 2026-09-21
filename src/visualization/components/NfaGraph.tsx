/**
 * PUBLIC COMPONENT — renders an ε-NFA.
 *
 * OWNER: Person 2. Consumed by Person 3 as:
 *   <NfaGraph nfa={result.nfa} />
 *
 * The props are part of the integration contract (see src/visualization/types.ts).
 * A `null`/`undefined` automaton must render the empty state, never crash.
 */

import { useMemo } from 'react';
import type { NfaGraphProps } from '../types';
import { adaptNfa } from '../adapters/nfaAdapter';
import { AutomataGraph } from './AutomataGraph';

export function NfaGraph({ nfa, height, className }: NfaGraphProps) {
  const graph = useMemo(() => (nfa ? adaptNfa(nfa) : null), [nfa]);

  return <AutomataGraph kind="nfa" graph={graph} height={height} className={className} />;
}
