/**
 * Comprehensive component tests for tests/components/.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegexInput } from '../../src/components/RegexInput';
import { ErrorDisplay } from '../../src/components/ErrorDisplay';
import { ExampleExpressions } from '../../src/components/ExampleExpressions';
import { StepNavigation } from '../../src/components/StepNavigation';
import { StepContent } from '../../src/components/StepContent';
import { TokenList } from '../../src/components/TokenList';
import { TransitionTable } from '../../src/components/TransitionTable';
import { DfaMapping } from '../../src/components/DfaMapping';
import { StringSimulator } from '../../src/components/StringSimulator';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingState } from '../../src/components/LoadingState';
import { AlgorithmExplanation } from '../../src/components/AlgorithmExplanation';
import { EXAMPLE_EXPRESSIONS } from '../../src/data/examples';
import { MOCK_DFA } from '../fixtures/mockAutomata';
import { PIPELINE_STEPS, type DFA } from '../../src/compiler';

describe('<RegexInput />', () => {
  it('submits the current expression on button click and Enter key', async () => {
    const onSubmit = vi.fn();
    render(<RegexInput value="a|b" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /create|convert/i }));
    expect(onSubmit).toHaveBeenCalledWith('a|b');

    await userEvent.type(screen.getByLabelText(/regular expression/i), '{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('auto-fills default placeholder (a|b)*abb when submitted empty', async () => {
    const onSubmit = vi.fn();
    render(<RegexInput value="" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /create|convert/i }));
    expect(onSubmit).toHaveBeenCalledWith('(a|b)*abb');
  });

  it('links aria-describedby and aria-invalid when hasError is true', () => {
    render(<RegexInput value="(a" hasError={true} errorId="custom-err" />);
    const input = screen.getByLabelText(/regular expression/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'custom-err');
  });

  it('clears expression when Clear button is clicked', async () => {
    const onChange = vi.fn();
    render(<RegexInput value="a|b" onChange={onChange} />);

    const clearButton = screen.getByRole('button', { name: /clear expression/i });
    expect(clearButton).toBeInTheDocument();
    await userEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith('');
  });
});

describe('<ErrorDisplay />', () => {
  it('renders nothing when there is no error', () => {
    const { container } = render(<ErrorDisplay message={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces the message to assistive technology and supports dismissal', async () => {
    const onDismiss = vi.fn();
    render(<ErrorDisplay message="Unbalanced parentheses." onDismiss={onDismiss} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unbalanced parentheses.');

    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

describe('<ExampleExpressions />', () => {
  it('offers every example from the shared data file and invokes onSelect when clicked', async () => {
    const onSelect = vi.fn();
    render(<ExampleExpressions onSelect={onSelect} />);
    for (const example of EXAMPLE_EXPRESSIONS) {
      expect(screen.getByText(example.expression)).toBeInTheDocument();
    }

    await userEvent.click(screen.getByText('(a|b)*abb'));
    expect(onSelect).toHaveBeenCalledWith('(a|b)*abb');
  });
});

describe('<StepNavigation />', () => {
  it('renders tabs with roving tabIndex and supports ArrowRight, ArrowLeft, Home, End keyboard navigation', async () => {
    const onSelect = vi.fn();
    render(<StepNavigation steps={PIPELINE_STEPS} activeStepId="input" onSelect={onSelect} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(PIPELINE_STEPS.length);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('tabIndex', '0');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('tabIndex', '-1');

    tabs[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onSelect).toHaveBeenCalledWith('tokens');

    await userEvent.keyboard('{End}');
    expect(onSelect).toHaveBeenCalledWith('simulation');

    await userEvent.keyboard('{Home}');
    expect(onSelect).toHaveBeenCalledWith('input');
  });
});

describe('<StepContent /> and <AlgorithmExplanation />', () => {
  it('renders step title, description, tabpanel role, and algorithm explanation', () => {
    const step = PIPELINE_STEPS[0];
    render(
      <>
        <StepContent step={step}>
          <p>Child body</p>
        </StepContent>
        <AlgorithmExplanation title={step.title}>Explanation body</AlgorithmExplanation>
      </>
    );

    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', `step-panel-${step.id}`);
    expect(screen.getByRole('heading', { name: step.title })).toBeInTheDocument();
    expect(screen.getByText('Child body')).toBeInTheDocument();
    expect(screen.getByText('Explanation body')).toBeInTheDocument();
  });
});

describe('<TokenList />', () => {
  it('renders placeholder when empty and token chips when populated', () => {
    const { rerender } = render(<TokenList tokens={[]} />);
    expect(screen.getByText(/no tokens/i)).toBeInTheDocument();

    rerender(<TokenList tokens={['(', 'a', '|', 'b', ')']} />);
    expect(screen.getByText('(')).toBeInTheDocument();
    expect(screen.getByText('|')).toBeInTheDocument();
  });
});

describe('<TransitionTable /> and <DfaMapping />', () => {
  it('renders state IDs as q0, q1 and missing transitions as em dash', () => {
    render(<TransitionTable dfa={MOCK_DFA} caption="Test DFA table" />);
    expect(screen.getByRole('table', { name: /Test DFA table/i })).toBeInTheDocument();
    expect(screen.getByText(/q0/)).toBeInTheDocument();
    expect(screen.getByText('start')).toBeInTheDocument();
    expect(screen.getAllByText('accept').length).toBeGreaterThan(0);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('supports row selection via onSelectState callback in TransitionTable', async () => {
    const onSelect = vi.fn();
    render(<TransitionTable dfa={MOCK_DFA} onSelectState={onSelect} selectedStateId={1} />);
    const q0Row = screen.getByText(/q0/).closest('tr');
    expect(q0Row).toBeInTheDocument();
    if (q0Row) await userEvent.click(q0Row);
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('renders DFA state mapping with position sets and acceptance', () => {
    render(<DfaMapping dfa={MOCK_DFA} />);
    expect(screen.getByText('{1, 2}')).toBeInTheDocument();
    expect(screen.getByText('{3}')).toBeInTheDocument();
    expect(screen.getAllByText('accepting')).toHaveLength(1);
    expect(screen.getByText('non-accepting')).toBeInTheDocument();
  });

  it('supports row selection via onSelectState callback in DfaMapping', async () => {
    const onSelect = vi.fn();
    render(<DfaMapping dfa={MOCK_DFA} onSelectState={onSelect} selectedStateId={0} />);
    const q1Row = screen.getByText('q1').closest('tr');
    expect(q1Row).toBeInTheDocument();
    if (q1Row) await userEvent.click(q1Row);
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});

describe('<StringSimulator />', () => {
  it('runs a valid string, displays verdict and trace, and steps through trace', async () => {
    render(<StringSimulator dfa={MOCK_DFA} />);

    const input = screen.getByLabelText(/input string/i);
    await userEvent.type(input, 'a{Enter}');

    expect(screen.getByRole('status')).toHaveTextContent(/ACCEPTED/i);
    expect(screen.getAllByText(/Step 1/i).length).toBeGreaterThan(0);

    // Toggle Play/Pause animation control
    const playButton = screen.getByRole('button', { name: /play simulation animation/i });
    expect(playButton).toBeInTheDocument();
    await userEvent.click(playButton);

    // Speed selector
    const speedSelect = screen.getByRole('combobox', { name: /playback speed/i });
    expect(speedSelect).toBeInTheDocument();

    // Reset simulation
    await userEvent.click(screen.getByRole('button', { name: /reset simulation/i }));
    expect(screen.queryByText(/Step 1/i)).not.toBeInTheDocument();
  });

  it('displays specific rejection reason for out-of-alphabet and missing transitions', async () => {
    render(<StringSimulator dfa={MOCK_DFA} />);

    const input = screen.getByLabelText(/input string/i);
    await userEvent.type(input, 'z{Enter}');

    expect(screen.getByRole('status')).toHaveTextContent(/REJECTED/i);
    expect(screen.getByText(/not in the alphabet/i)).toBeInTheDocument();
  });

  it('routes missing transitions to dead state (qd) and auto-plays multi-step strings', async () => {
    // DFA for (a|b)(c|d)
    const dfaExample: DFA = {
      states: [
        { id: 0, positions: [1, 2], isAccepting: false },
        { id: 1, positions: [3, 4], isAccepting: false },
        { id: 2, positions: [5], isAccepting: true },
      ],
      alphabet: ['a', 'b', 'c', 'd'],
      startState: 0,
      acceptStates: [2],
      transitions: [
        { from: 0, to: 1, symbol: 'a' },
        { from: 0, to: 1, symbol: 'b' },
        { from: 1, to: 2, symbol: 'c' },
        { from: 1, to: 2, symbol: 'd' },
      ],
    };

    render(<StringSimulator dfa={dfaExample} />);

    const input = screen.getByLabelText(/input string/i);
    // 'ab' is rejected at step 2 because q1 has no transition on 'b'
    await userEvent.type(input, 'ab{Enter}');

    expect(screen.getByRole('status')).toHaveTextContent(/REJECTED/i);
    // Step 2 shows transition to dead state qd
    expect(screen.getAllByText(/trap state/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/qd/i).length).toBeGreaterThan(0);

    // Multi-step string auto-advances, so pause button is initially present
    const pauseButton = screen.queryByRole('button', { name: /pause simulation animation/i });
    expect(pauseButton).toBeInTheDocument();

    // Clicking on step 1 in the trace jumps directly to step 1
    const step1 = screen.getByTitle(/jump to step 1/i);
    await userEvent.click(step1);
    expect(step1).toHaveClass('current');

    // Toggle trap state off
    const trapStateToggle = screen.getByRole('button', { name: /hide trap state/i });
    await userEvent.click(trapStateToggle);
    expect(screen.getByText(/\(no transition\)/i)).toBeInTheDocument();
  });
});

describe('<EmptyState /> and <LoadingState />', () => {
  it('renders empty and loading states accessibly', () => {
    render(
      <>
        <EmptyState />
        <LoadingState />
      </>
    );

    expect(screen.getByText(/Nothing to show yet/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Building the automaton/i);
  });
});
