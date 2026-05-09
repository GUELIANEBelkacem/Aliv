import { useMemo } from 'react';
import type { DetectedFormat } from '../types/settings';

export function detectFormat(input: string): DetectedFormat {
  const trimmed = input.trimStart();
  if (!trimmed) return 'unknown';
  if (trimmed[0] === '{' || trimmed[0] === '[') return 'json';
  if (trimmed[0] === '<') return 'xml';
  return 'unknown';
}

export function useAutoDetect(input: string): DetectedFormat {
  return useMemo(() => detectFormat(input), [input]);
}
