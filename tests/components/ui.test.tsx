/**
 * Seed test for tests/components/ — OWNER: Person 3.
 *
 * Person 3 extends this directory with a test per component.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegexInput } from '../../src/components/RegexInput';
import { ErrorDisplay } from '../../src/components/ErrorDisplay';
import { ExampleExpressions } from '../../src/components/ExampleExpressions';
import { EXAMPLE_EXPRESSIONS } from '../../src/data/examples';

describe('<RegexInput />', () => {
  it('submits the current expression', async () => {
    const onSubmit = vi.fn();
    render(<RegexInput value="a|b" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /convert/i }));

    expect(onSubmit).toHaveBeenCalledWith('a|b');
  });
});

describe('<ErrorDisplay />', () => {
  it('renders nothing when there is no error', () => {
    const { container } = render(<ErrorDisplay message={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces the message to assistive technology', () => {
    render(<ErrorDisplay message="Unbalanced parentheses." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unbalanced parentheses.');
  });
});

describe('<ExampleExpressions />', () => {
  it('offers every example from the shared data file', () => {
    render(<ExampleExpressions />);
    for (const example of EXAMPLE_EXPRESSIONS) {
      expect(screen.getByText(example.expression)).toBeInTheDocument();
    }
  });
});
