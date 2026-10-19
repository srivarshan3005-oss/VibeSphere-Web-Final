import { createContext, useContext } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ThemeCtx = {
  mode: ThemeMode;
  /** The theme actually on screen right now. */
  resolved: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
};

export const THEME_KEY = 'vibesphere.themeMode';
export const ThemeContext = createContext<ThemeCtx | null>(null);

export function useTheme(): ThemeCtx {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme must be used inside <ThemeProvider>');
  return v;
}
