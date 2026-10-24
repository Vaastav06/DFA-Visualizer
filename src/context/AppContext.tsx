/**
 * Application-wide state.
 *
 * OWNER: Person 3.
 * Provides compiler state, current regex expression, and active pipeline step.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useCompiler, type UseCompilerApi } from '../hooks/useCompiler';
import type { CompilationStepId } from '../compiler';

export interface AppContextValue extends UseCompilerApi {
  /** The regex currently in the input field. */
  expression: string;
  setExpression: (value: string) => void;
  /** Which pipeline step the user is viewing. */
  activeStep: CompilationStepId;
  setActiveStep: (step: CompilationStepId) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const compiler = useCompiler();
  const [expression, setExpression] = useState('');
  const [activeStep, setActiveStep] = useState<CompilationStepId>('input');

  const value = useMemo<AppContextValue>(
    () => ({ ...compiler, expression, setExpression, activeStep, setActiveStep }),
    [compiler, expression, activeStep]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** Reads the app context. Throws if used outside `<AppProvider>`. */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppContext must be used inside <AppProvider>.');
  }
  return context;
}
