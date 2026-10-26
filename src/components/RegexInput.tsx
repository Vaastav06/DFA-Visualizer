/**
 * The regular-expression input field and Convert button.
 *
 * OWNER: Person 3.
 * Supports keyboard submit, disabled state, and aria-describedby error wiring.
 */

import { useState, type FormEvent } from 'react';
import '../styles/components/RegexInput.css';

interface RegexInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  errorId?: string;
}

const DEFAULT_PLACEHOLDER = '(a|b)*abb';

export function RegexInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  hasError = false,
  errorId = 'regex-error-message',
}: RegexInputProps) {
  const [internal, setInternal] = useState('');
  const current = value ?? internal;

  function handleChange(next: string) {
    setInternal(next);
    onChange?.(next);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const effectiveValue = current.trim() === '' ? DEFAULT_PLACEHOLDER : current;
    if (current.trim() === '') {
      setInternal(effectiveValue);
      onChange?.(effectiveValue);
    }
    onSubmit?.(effectiveValue);
  }

  return (
    <form className="regex-input" onSubmit={handleSubmit}>
      <label className="regex-input__label" htmlFor="regex-input-field">
        Regular expression
      </label>
      <div className="regex-input__row">
        <input
          id="regex-input-field"
          className="regex-input__field"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={DEFAULT_PLACEHOLDER}
          value={current}
          disabled={disabled}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={hasError ? errorId : undefined}
          onChange={(event) => handleChange(event.target.value)}
        />
        <button
          type="submit"
          className="button button--primary regex-input__submit"
          disabled={disabled}
          aria-label="Create DFA (Convert)"
        >
          Create DFA
        </button>
      </div>
    </form>
  );
}
