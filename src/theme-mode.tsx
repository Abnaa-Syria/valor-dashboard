import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThemeMode } from './theme';

const STORAGE_KEY = 'valor-admin-theme';

type Ctx = { mode: ThemeMode; setMode: (mode: ThemeMode) => void; toggle: () => void };

const ThemeModeContext = createContext<Ctx>({ mode: 'dark', setMode: () => {}, toggle: () => {} });

/** The saved choice, else the system preference, else dark (the original console look). */
function initialMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Storage blocked: fall through to the system preference.
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function apply(mode: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#0b0a12' : '#f5f3fb');
}

// Set before the first render so the page never flashes the wrong mode.
apply(initialMode());

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  useEffect(() => apply(mode), [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not saved; the choice still applies for this visit.
    }
  }, []);

  const value = useMemo(() => ({ mode, setMode, toggle: () => setMode(mode === 'dark' ? 'light' : 'dark') }), [mode, setMode]);
  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export const useThemeMode = () => useContext(ThemeModeContext);
