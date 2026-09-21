/**
 * The regular-expression input field and Convert button.
 *
 * OWNER: Person 3.
 * TODO(Person 3): validation feedback as the user types, keyboard submit,
 * aria-describedby wiring to the error message.
 */

import { useState, type FormEvent } from 'react';

interface RegexInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  disabled?: boolean;
}

export function RegexInput({ value, onChange, onSubmit, disabled = false }: RegexInputProps) {
  const [internal, setInternal] = useState('');
  const current = value ?? internal;

  function handleChange(next: string) {
    setInternal(next);
    onChange?.(next);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit?.(current);
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
          placeholder="(a|b)*abb"
          value={current}
          disabled={disabled}
          onChange={(event) => handleChange(event.target.value)}
        />
        <button type="submit" className="button button--primary" disabled={disabled}>
          Convert
        </button>
      </div>
    </form>
  );
}
