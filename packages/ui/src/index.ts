export { AppShell } from './components/AppShell';
export { AppSwitcher } from './components/AppSwitcher';
export { Logo } from './components/Logo';
export { Button, type ButtonVariant } from './components/Button';
export { IconButton } from './components/IconButton';
export { Drawer } from './components/Drawer';
export { ShortcutsModal, formatKeys } from './components/ShortcutsModal';

export { ThemeToggle } from './theme/ThemeToggle';
export { useTheme } from './theme/useTheme';
export { getTheme, setTheme, subscribe, type Theme } from './theme/theme-store';

export { useShortcuts, type Shortcut } from './hooks/useShortcuts';
export { useCopyFeedback } from './hooks/useCopyFeedback';
export { useMediaQuery } from './hooks/useMediaQuery';

export { APPS, appUrl, getApp } from './registry/app-registry';
export type { AppId, AppDefinition } from './registry/types';
