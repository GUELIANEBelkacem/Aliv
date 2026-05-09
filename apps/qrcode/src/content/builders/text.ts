import type { BuildResult } from '../types';

export function buildText(text: string): BuildResult {
  return { ok: true, value: text };
}
