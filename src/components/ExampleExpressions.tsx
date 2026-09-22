/**
 * Clickable list of example expressions.
 *
 * OWNER: Person 3.
 * Reads src/data/examples.ts — never hard-code expressions in this file.
 */

import { EXAMPLE_EXPRESSIONS } from '../data/examples';
import '../styles/components/ExampleExpressions.css';

interface ExampleExpressionsProps {
  onSelect?: (expression: string) => void;
}

export function ExampleExpressions({ onSelect }: ExampleExpressionsProps) {
  return (
    <section className="examples" aria-labelledby="examples-heading">
      <h2 id="examples-heading" className="examples__heading">
        Examples
      </h2>
      <ul className="examples__list">
        {EXAMPLE_EXPRESSIONS.map((example) => (
          <li key={example.expression}>
            <button
              type="button"
              className="examples__item"
              title={example.description}
              onClick={() => onSelect?.(example.expression)}
            >
              <code>{example.expression}</code>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
