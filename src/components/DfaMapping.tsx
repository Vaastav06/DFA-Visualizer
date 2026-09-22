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

export function DfaMapping({ dfa, caption = 'DFA state mapping' }: DfaMappingProps) {
  const acceptSet = new Set(dfa.acceptStates);

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
        {dfa.states.map((state) => {
          const nfaSet =
            state.nfaStates.length === 0
              ? '{}'
              : `{${state.nfaStates.map((id) => formatStateId(id)).join(', ')}}`;
          const accepting = state.isAccepting || acceptSet.has(state.id);
          return (
            <tr key={state.id}>
              <th scope="row">{formatStateId(state.id)}</th>
              <td>
                <code>{nfaSet}</code>
              </td>
              <td>{accepting ? 'yes' : 'no'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
