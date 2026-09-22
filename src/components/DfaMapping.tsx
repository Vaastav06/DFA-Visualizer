/**
 * Shows the syntax-tree position set that each DFA state represents.
 *
 * OWNER: Person 3.
 *
 * Reads `DFAState.positions` from the shared contract and renders rows like:
 *   q0   {1, 2, 3}   accepting
 *   q1   {1, 4, 5}   accepting
 */

import type { DFA, DFAState } from '../compiler';

interface DfaMappingProps {
  dfa: DFA;
  caption?: string;
}

/** Maps a single DFA state to a table row. */
function stateToRow(state: DFAState) {
  const posString = state.positions.length > 0 ? `{${state.positions.join(', ')}}` : '∅';
  const accepting = state.isAccepting ? 'accepting' : 'non-accepting';
  return { posString, accepting };
}

export function DfaMapping({ dfa, caption = 'DFA state mapping' }: DfaMappingProps) {
  return (
    <table className="dfa-mapping">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">DFA state</th>
          <th scope="col">Position set</th>
          <th scope="col">Accepting</th>
        </tr>
      </thead>
      <tbody>
        {dfa.states.map((state) => {
          const { posString, accepting } = stateToRow(state);
          return (
            <tr key={state.id}>
              <th scope="row">q{state.id}</th>
              <td>
                <code>{posString}</code>
              </td>
              <td>{accepting}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
