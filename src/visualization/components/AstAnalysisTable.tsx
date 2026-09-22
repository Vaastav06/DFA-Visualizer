/**
 * Table displaying Nullable, Firstpos, and Lastpos AST node analysis.
 *
 * OWNER: Person 2.
 * Formats the compiler's authoritative node-level analysis without recalculation.
 */

import { useMemo } from 'react';
import type { SyntaxNode } from '../../compiler/types';

interface NodeAnalysisRow {
  id: number;
  type: string;
  label: string;
  nullable: boolean;
  firstpos: number[];
  lastpos: number[];
  isEndMarker?: boolean;
}

interface AstAnalysisTableProps {
  tree: SyntaxNode | null | undefined;
  className?: string;
  selectedNodeId?: number | null;
  onSelectNode?: (nodeId: number) => void;
}

function extractRows(node: SyntaxNode): NodeAnalysisRow[] {
  const rows: NodeAnalysisRow[] = [];

  function traverse(curr: SyntaxNode) {
    rows.push({
      id: curr.id,
      type: curr.type,
      label: curr.type === 'symbol' ? (curr.symbol ?? '') : curr.type,
      nullable: curr.nullable,
      firstpos: curr.firstpos ?? [],
      lastpos: curr.lastpos ?? [],
      isEndMarker: curr.type === 'symbol' && curr.symbol === '#',
    });

    if (curr.left) traverse(curr.left);
    if (curr.right) traverse(curr.right);
  }

  traverse(node);
  // Sort rows deterministically by node id
  return rows.sort((a, b) => a.id - b.id);
}

export function AstAnalysisTable({
  tree,
  className,
  selectedNodeId,
  onSelectNode,
}: AstAnalysisTableProps) {
  const rows = useMemo(() => (tree ? extractRows(tree) : []), [tree]);

  if (!tree || rows.length === 0) {
    return (
      <div className="vis-empty-state" role="status">
        <p>No AST analysis available.</p>
      </div>
    );
  }

  return (
    <div className={['vis-table-container', className].filter(Boolean).join(' ')}>
      <table className="vis-table analysis-table" aria-label="Syntax tree node analysis">
        <caption className="vis-table__caption">
          Nullable, firstpos, and lastpos computed per Dragon Book Algorithm 3.36 rules
        </caption>
        <thead>
          <tr>
            <th scope="col">Node ID</th>
            <th scope="col">Type / Symbol</th>
            <th scope="col">Nullable</th>
            <th scope="col">firstpos</th>
            <th scope="col">lastpos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = selectedNodeId === row.id;

            return (
              <tr
                key={row.id}
                className={[
                  isSelected ? 'vis-table__row--selected' : '',
                  onSelectNode ? 'vis-table__row--clickable' : '',
                  row.isEndMarker ? 'analysis-table__row--end' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectNode?.(row.id)}
                tabIndex={onSelectNode ? 0 : undefined}
                role={onSelectNode ? 'button' : undefined}
              >
                <td className="vis-table__num-cell">#{row.id}</td>
                <td>
                  <code>{row.label}</code>
                  {row.isEndMarker && <span className="vis-tag">end-marker</span>}
                </td>
                <td>
                  <span
                    className={`vis-bool ${row.nullable ? 'vis-bool--true' : 'vis-bool--false'}`}
                  >
                    {row.nullable ? 'true' : 'false'}
                  </span>
                </td>
                <td className="vis-table__set-cell">{'{' + row.firstpos.join(', ') + '}'}</td>
                <td className="vis-table__set-cell">{'{' + row.lastpos.join(', ') + '}'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
