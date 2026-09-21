/**
 * Shows which NFA states each DFA state was built from.
 *
 * OWNER: Person 3.
 * TODO(Person 3): implement the body.
 *
 * Reads `DFAState.nfaStates` from the shared contract and renders rows like:
 *   q2   {1, 3, 4}   accepting
 */

import type { DFA } from '../compiler';

interface DfaMappingProps {
  dfa: DFA;
  caption?: string;
}

export function DfaMapping({ dfa, caption = 'DFA state mapping' }: DfaMappingProps) {
  void dfa;
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
      <tbody>{/* TODO(Person 3): one row per dfa.states entry, using state.nfaStates. */}</tbody>
    </table>
  );
}
