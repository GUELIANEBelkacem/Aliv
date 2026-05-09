import { useEffect, useState } from 'react';
import { getTheme, setTheme as setStored, subscribe, type Theme } from './theme-store';

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setLocal] = useState<Theme>(() => getTheme());

  useEffect(() => {
    return subscribe(setLocal);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  return [theme, setStored];
}
