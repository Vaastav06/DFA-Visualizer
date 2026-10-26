/**
 * The single bridge between the UI and the compiler.
 *
 * OWNER: Person 3.
 *
 * CONTRACT: no component calls `compileRegex` directly — they all go through
 * this hook, so error handling, loading state and the epsilon/state-id display
 * conventions live in exactly one place.
 */

import { useCallback, useState } from 'react';
import {
  compileRegex,
  isCompilerError,
  GENERIC_ERROR_MESSAGE,
  type CompilationResult,
} from '../compiler';

export interface UseCompilerState {
  result: CompilationResult | null;
  error: string | null;
  isCompiling: boolean;
}

export interface UseCompilerApi extends UseCompilerState {
  /** Compiles `regex` and stores the result or a user-facing error message. */
  compile: (regex: string) => void;
  /** Clears the current result and error. */
  reset: () => void;
}

export function useCompiler(): UseCompilerApi {
  const [state, setState] = useState<UseCompilerState>({
    result: null,
    error: null,
    isCompiling: false,
  });

  const compile = useCallback((regex: string) => {
    setState({ result: null, error: null, isCompiling: true });
    try {
      const result = compileRegex(regex);
      setState({ result, error: null, isCompiling: false });
    } catch (error) {
      // User-facing message only. Developer detail stays on the error object.
      const message = isCompilerError(error) ? error.message : GENERIC_ERROR_MESSAGE;
      setState({ result: null, error: message, isCompiling: false });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ result: null, error: null, isCompiling: false });
  }, []);

  return { ...state, compile, reset };
}

/** Numeric state id assigned to the visual dead/trap state. */
export const DEAD_STATE_ID = -1;

/** Formats a numeric state id for display (STATE ID CONTRACT). */
export function formatStateId(id: number): string {
  if (id === DEAD_STATE_ID) {
    return 'qd';
  }
  return `q${id}`;
}
