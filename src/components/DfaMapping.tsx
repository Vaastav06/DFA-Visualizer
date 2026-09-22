/**
 * Shows which NFA states each DFA state was built from.
 *
 * OWNER: Person 3.
 *
 * Reads `DFAState.nfaStates` from the shared contract and renders rows like:
 *   q2   {1, 3, 4}   accepting
 */

import type { DFA } from '../compiler';
import { formatStateId } from '../hooks/useCompiler';

interface DfaMappingProps {
  dfa: DFA;
  caption?: string;
}

function formatNfaStates(nfaStates: number[]): string {
  return '{' + nfaStates.map(formatStateId).join(', ') + '}';
}

export function DfaMapping({ dfa, caption = 'DFA state mapping' }: DfaMappingProps) {
  return (
    <table className="dfa-mapping">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">DFA state</th>
          <th scope="col">NFA states</th>
          <th scope="col">Accepting</th>
        </tr>
      </thead>
      <tbody>
        {dfa.states.map((state) => (
          <tr key={state.id}>
            <td>{formatStateId(state.id)}</td>
            <td><code>{formatNfaStates(state.nfaStates)}</code></td>
            <td>{state.isAccepting ? 'Yes' : 'No'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
