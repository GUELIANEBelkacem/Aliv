import { XMLValidator } from 'fast-xml-parser';
import type { ConversionError } from '../types/settings';

export function validateJson(input: string): ConversionError | null {
  try {
    JSON.parse(input);
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const match = msg.match(/position\s+(\d+)/i);
    let line: number | undefined;
    let column: number | undefined;
    if (match) {
      const pos = parseInt(match[1], 10);
      const before = input.slice(0, pos);
      line = (before.match(/\n/g)?.length ?? 0) + 1;
      column = pos - before.lastIndexOf('\n');
    }
    return { message: msg, line, column };
  }
}

export function validateXml(input: string): ConversionError | null {
  const result = XMLValidator.validate(input);
  if (result === true) return null;
  return {
    message: result.err.msg,
    line: result.err.line,
    column: result.err.col,
  };
}
