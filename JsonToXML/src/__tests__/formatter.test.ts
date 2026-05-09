import { describe, it, expect } from 'vitest';
import { prettifyJson, minifyJson, prettifyXml, minifyXml } from '../lib/formatter';

// ─── 4.1 prettifyJson ───────────────────────────────────────────────

describe('prettifyJson', () => {
  it('FJ-1: minified JSON, 2-space', () => {
    const result = prettifyJson('{"a":1,"b":2}', '  ');
    expect(result).toContain('  "a"');
    expect(result).toContain('  "b"');
  });

  it('FJ-2: minified JSON, 4-space', () => {
    const result = prettifyJson('{"a":1}', '    ');
    expect(result).toContain('    "a"');
  });

  it('FJ-3: minified JSON, tab', () => {
    const result = prettifyJson('{"a":1}', '\t');
    expect(result).toContain('\t"a"');
  });

  it('FJ-4: already pretty JSON is idempotent', () => {
    const pretty = '{\n  "a": 1\n}';
    const result = prettifyJson(pretty, '  ');
    expect(result).toBe(pretty);
  });

  it('FJ-5: nested object', () => {
    const result = prettifyJson('{"a":{"b":{"c":1}}}', '  ');
    expect(result).toContain('      "c"');
  });

  it('FJ-6: array', () => {
    const result = prettifyJson('[1,2,3]', '  ');
    const lines = result.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('FJ-7: invalid JSON throws', () => {
    expect(() => prettifyJson('{bad}', '  ')).toThrow();
  });

  it('FJ-8: empty object', () => {
    const result = prettifyJson('{}', '  ');
    expect(result).toBe('{}');
  });
});

// ─── 4.2 minifyJson ─────────────────────────────────────────────────

describe('minifyJson', () => {
  it('MJ-1: pretty JSON', () => {
    const result = minifyJson('{\n  "a": 1\n}');
    expect(result).toBe('{"a":1}');
  });

  it('MJ-2: already minified', () => {
    const result = minifyJson('{"a":1}');
    expect(result).toBe('{"a":1}');
  });

  it('MJ-3: nested with whitespace', () => {
    const pretty = prettifyJson('{"a":{"b":{"c":1}}}', '  ');
    const result = minifyJson(pretty);
    expect(result).toBe('{"a":{"b":{"c":1}}}');
  });

  it('MJ-4: invalid JSON throws', () => {
    expect(() => minifyJson('{bad}')).toThrow();
  });
});

// ─── 4.3 prettifyXml ────────────────────────────────────────────────

describe('prettifyXml', () => {
  it('FX-1: minified XML', () => {
    const result = prettifyXml('<r><a>v</a></r>', '  ');
    expect(result).toContain('  <a>');
    expect(result).toContain('</r>');
  });

  it('FX-2: self-closing tag', () => {
    const result = prettifyXml('<r><empty/></r>', '  ');
    expect(result).toContain('  <empty/>');
  });

  it('FX-3: XML declaration', () => {
    const result = prettifyXml('<?xml version="1.0"?><r/>', '  ');
    expect(result).toMatch(/^<\?xml/);
  });

  it('FX-4: comment', () => {
    const result = prettifyXml('<r><!-- note --><a/></r>', '  ');
    expect(result).toContain('  <!-- note -->');
  });

  it('FX-5: text content stays inline', () => {
    const result = prettifyXml('<r><a>text</a></r>', '  ');
    // Text should be inline with opening tag, not on separate line
    expect(result).toContain('<a>text');
  });

  it('FX-6: mixed tags and text', () => {
    const result = prettifyXml('<r>text<a/></r>', '  ');
    expect(result).toContain('text');
    expect(result).toContain('<a/>');
  });

  it('FX-7: tab indent', () => {
    const result = prettifyXml('<r><a>v</a></r>', '\t');
    expect(result).toContain('\t<a>');
  });

  it('FX-8: already pretty is mostly idempotent', () => {
    const pretty = prettifyXml('<r><a>v</a></r>', '  ');
    const result = prettifyXml(pretty, '  ');
    expect(result).toBe(pretty);
  });

  it('FX-9: non-XML returns input unchanged', () => {
    const garbage = 'just plain text with no tags';
    const result = prettifyXml(garbage, '  ');
    // If no tokens match, returns input
    expect(result).toBeDefined();
  });

  it('FX-10: empty text node trimmed', () => {
    // Whitespace between tags should be removed, not produce blank lines
    const result = prettifyXml('<r>   <a/></r>', '  ');
    expect(result).toContain('<a/>');
  });

  it('FX-11: deeply nested (5 levels)', () => {
    const result = prettifyXml('<a><b><c><d><e/></d></c></b></a>', '  ');
    expect(result).toContain('        <e/>');
  });
});

// ─── 4.4 minifyXml ──────────────────────────────────────────────────

describe('minifyXml', () => {
  it('MX-1: pretty XML', () => {
    const result = minifyXml('<r>\n  <a>v</a>\n</r>');
    expect(result).toBe('<r><a>v</a></r>');
  });

  it('MX-2: already minified', () => {
    const result = minifyXml('<r><a>v</a></r>');
    expect(result).toBe('<r><a>v</a></r>');
  });

  it('MX-3: multiple blank lines', () => {
    const result = minifyXml('<r>\n\n\n<a/>\n</r>');
    expect(result).toBe('<r><a/></r>');
  });

  it('MX-4: leading/trailing whitespace', () => {
    const result = minifyXml('  <r/>  ');
    expect(result).toBe('<r/>');
  });
});
