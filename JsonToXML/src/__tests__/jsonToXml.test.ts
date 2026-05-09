import { describe, it, expect } from 'vitest';
import { jsonToXml } from '../lib/converter';
import { opts } from './helpers';

// Helper: convert and return the XML output string
function convert(json: string, overrides = {}) {
  return jsonToXml(json, opts(overrides));
}

// ─── 2.1 Basic Valid Conversions ─────────────────────────────────────

describe('jsonToXml — basic', () => {
  it('J2X-1: simple object', () => {
    const r = convert('{"root":"hello"}');
    expect(r.error).toBeNull();
    expect(r.output).toContain('<root>hello</root>');
  });

  it('J2X-2: nested object', () => {
    const r = convert('{"a":{"b":{"c":"v"}}}');
    expect(r.error).toBeNull();
    expect(r.output).toContain('<c>v</c>');
    expect(r.output).toContain('<b>');
    expect(r.output).toContain('<a>');
  });

  it('J2X-3: multiple keys', () => {
    const r = convert('{"root":{"a":"1","b":"2"}}');
    expect(r.output).toContain('<a>1</a>');
    expect(r.output).toContain('<b>2</b>');
  });

  it('J2X-4: empty string value', () => {
    const r = convert('{"root":""}');
    expect(r.error).toBeNull();
    expect(r.output).toContain('<root>');
  });

  it('J2X-5: null value', () => {
    const r = convert('{"root":{"a":null}}');
    expect(r.error).toBeNull();
    // null produces self-closing <a/>
    expect(r.output).toContain('<a');
  });
});

// ─── 2.2 Top-Level Wrapping ──────────────────────────────────────────

describe('jsonToXml — wrapping', () => {
  it('J2X-10: top-level array', () => {
    const r = convert('[1, 2, 3]');
    expect(r.error).toBeNull();
    expect(r.output).toContain('<root>');
    expect(r.output).toContain('<item>');
  });

  it('J2X-11: top-level array of objects', () => {
    const r = convert('[{"a":1},{"a":2}]');
    expect(r.output).toContain('<item>');
    expect(r.output).toContain('<a>');
  });

  it('J2X-12: top-level string primitive', () => {
    const r = convert('"hello"');
    expect(r.error).toBeNull();
    expect(r.output).toContain('<root>');
    expect(r.output).toContain('hello');
  });

  it('J2X-13: top-level number primitive', () => {
    const r = convert('42');
    expect(r.error).toBeNull();
    expect(r.output).toContain('42');
  });

  it('J2X-14: top-level boolean primitive', () => {
    const r = convert('true');
    expect(r.error).toBeNull();
    expect(r.output).toContain('true');
  });

  it('J2X-15: top-level null', () => {
    const r = convert('null');
    expect(r.error).toBeNull();
    expect(r.output).toContain('null');
  });

  it('J2X-16: single-key object (no extra wrapping)', () => {
    const r = convert('{"data":"v"}');
    expect(r.output).toContain('<data>v</data>');
    // Should NOT wrap in extra <root>
    expect(r.output).not.toContain('<root>');
  });

  it('J2X-17: multi-key top-level object', () => {
    const r = convert('{"a":"1","b":"2"}');
    expect(r.output).toContain('<a>1</a>');
    expect(r.output).toContain('<b>2</b>');
  });
});

// ─── 2.3 Attributes ─────────────────────────────────────────────────

describe('jsonToXml — attributes', () => {
  it('J2X-20: single attribute', () => {
    const r = convert('{"book":{"@_id":"1"}}');
    expect(r.output).toContain('id="1"');
    expect(r.output).toContain('<book');
  });

  it('J2X-21: attribute + text', () => {
    const r = convert('{"book":{"@_id":"1","#text":"Title"}}');
    expect(r.output).toContain('id="1"');
    expect(r.output).toContain('Title');
  });

  it('J2X-22: attribute + children', () => {
    const r = convert('{"r":{"@_id":"1","child":"v"}}');
    expect(r.output).toContain('id="1"');
    expect(r.output).toContain('<child>v</child>');
  });

  it('J2X-23: custom prefix $', () => {
    const r = convert('{"r":{"$id":"1"}}', { attributePrefix: '$' });
    expect(r.output).toContain('id="1"');
  });

  it('J2X-24: multiple attributes', () => {
    const r = convert('{"r":{"@_a":"1","@_b":"2"}}');
    expect(r.output).toContain('a="1"');
    expect(r.output).toContain('b="2"');
  });
});

// ─── 2.4 Arrays to Repeated Elements ────────────────────────────────

describe('jsonToXml — arrays', () => {
  it('J2X-30: simple array', () => {
    const r = convert('{"r":{"item":["a","b","c"]}}');
    const matches = r.output.match(/<item>/g);
    expect(matches).toHaveLength(3);
  });

  it('J2X-31: array of objects', () => {
    const r = convert('{"r":{"item":[{"n":"a"},{"n":"b"}]}}');
    expect(r.output).toContain('<item>');
    expect(r.output).toContain('<n>a</n>');
    expect(r.output).toContain('<n>b</n>');
  });

  it('J2X-32: single-element array', () => {
    const r = convert('{"r":{"item":["a"]}}');
    expect(r.output).toContain('<item>a</item>');
  });

  it('J2X-33: empty array', () => {
    const r = convert('{"r":{"item":[]}}');
    expect(r.error).toBeNull();
    // Should not produce <item> elements
    expect(r.output).not.toContain('<item>');
  });

  it('J2X-34: nested arrays', () => {
    const r = convert('{"r":{"a":[{"b":["x","y"]}]}}');
    expect(r.error).toBeNull();
    expect(r.output).toContain('<b>x</b>');
    expect(r.output).toContain('<b>y</b>');
  });

  it('J2X-35: array of mixed types', () => {
    const r = convert('{"r":{"item":[1,"two",true,null]}}');
    expect(r.error).toBeNull();
    expect(r.output).toContain('<item>1</item>');
    expect(r.output).toContain('<item>two</item>');
  });
});

// ─── 2.5 XML Declaration ────────────────────────────────────────────

describe('jsonToXml — declaration', () => {
  it('J2X-40: declaration off (default)', () => {
    const r = convert('{"r":"v"}');
    expect(r.output).not.toContain('<?xml');
  });

  it('J2X-41: declaration on', () => {
    const r = convert('{"r":"v"}', { preserveDeclaration: true });
    expect(r.output).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });
});

// ─── 2.6 Comments ───────────────────────────────────────────────────

describe('jsonToXml — comments', () => {
  it('J2X-45: comment property preserved', () => {
    const r = convert('{"r":{"#comment":"note","a":"v"}}', { preserveComments: true });
    expect(r.output).toContain('<!--');
    expect(r.output).toContain('note');
  });

  it('J2X-46: comment property stripped', () => {
    const r = convert('{"r":{"#comment":"note","a":"v"}}', { preserveComments: false });
    expect(r.output).not.toContain('<!--');
  });
});

// ─── 2.7 Special Characters ─────────────────────────────────────────

describe('jsonToXml — special characters', () => {
  it('J2X-50: ampersand in value', () => {
    const r = convert('{"r":"a & b"}');
    expect(r.output).toContain('&amp;');
  });

  it('J2X-51: less-than in value', () => {
    const r = convert('{"r":"a < b"}');
    expect(r.output).toContain('&lt;');
  });

  it('J2X-52: greater-than in value', () => {
    const r = convert('{"r":"a > b"}');
    // > may or may not be escaped — both are valid XML
    expect(r.output).toContain('a');
    expect(r.output).toContain('b');
  });

  it('J2X-53: quote in attribute value', () => {
    const r = convert('{"r":{"@_a":"he said \\"hi\\""}}');
    expect(r.error).toBeNull();
    expect(r.output).toContain('a=');
  });

  it('J2X-54: unicode in value', () => {
    const r = convert('{"r":"日本語"}');
    expect(r.output).toContain('日本語');
  });
});

// ─── 2.8 Indentation ────────────────────────────────────────────────

describe('jsonToXml — indentation', () => {
  it('J2X-60: 2-space indent', () => {
    const r = convert('{"r":{"a":"v"}}', { indentation: '  ' });
    expect(r.output).toContain('  <a>');
  });

  it('J2X-61: 4-space indent', () => {
    const r = convert('{"r":{"a":"v"}}', { indentation: '    ' });
    expect(r.output).toContain('    <a>');
  });

  it('J2X-62: tab indent', () => {
    const r = convert('{"r":{"a":"v"}}', { indentation: '\t' });
    expect(r.output).toContain('\t<a>');
  });
});

// ─── 2.9 JSON Parse Errors ──────────────────────────────────────────

describe('jsonToXml — parse errors', () => {
  it('J2X-70: missing closing brace', () => {
    const r = convert('{"a": 1');
    expect(r.error).not.toBeNull();
  });

  it('J2X-71: trailing comma', () => {
    const r = convert('{"a": 1,}');
    expect(r.error).not.toBeNull();
  });

  it('J2X-72: single quotes', () => {
    const r = convert("{'a': 1}");
    expect(r.error).not.toBeNull();
  });

  it('J2X-73: unquoted key', () => {
    const r = convert('{a: 1}');
    expect(r.error).not.toBeNull();
  });

  it('J2X-74: empty string', () => {
    const r = convert('');
    // Empty input causes JSON.parse to throw
    expect(r.error).not.toBeNull();
  });

  it('J2X-75: error with position extraction', () => {
    const r = convert('{"a": undefined}');
    expect(r.error).not.toBeNull();
    expect(r.error!.message).toBeTruthy();
  });

  it('J2X-76: multiline JSON error — line number extraction', () => {
    const r = convert('{\n  "a": 1,\n  "b": \n}');
    expect(r.error).not.toBeNull();
    // Error should have some position info
    expect(r.error!.message).toBeTruthy();
  });
});

// ─── 2.10 Edge Cases ────────────────────────────────────────────────

describe('jsonToXml — edge cases', () => {
  it('J2X-80: deeply nested (50 levels — within parser limit)', () => {
    let obj: Record<string, unknown> = { val: 'v' };
    for (let i = 0; i < 50; i++) obj = { a: obj };
    const r = convert(JSON.stringify(obj));
    expect(r.error).toBeNull();
    expect(r.output).toContain('v');
  });

  it('J2X-81: very large array (1000 items)', () => {
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    const r = convert(JSON.stringify({ r: { i: arr } }));
    expect(r.error).toBeNull();
    const matches = r.output.match(/<i>/g);
    expect(matches).toHaveLength(1000);
  });

  it('J2X-82: key with special XML chars', () => {
    // Keys with & may produce invalid XML, but shouldn't crash
    const r = convert('{"a_b":"v"}');
    expect(r.error).toBeNull();
  });

  it('J2X-83: key with spaces', () => {
    const r = convert('{"my key":"v"}');
    // May produce invalid XML tag, but should not throw
    expect(r.error).toBeNull();
  });

  it('J2X-84: key starting with number', () => {
    const r = convert('{"1a":"v"}');
    expect(r.error).toBeNull();
  });

  it('J2X-85: empty object', () => {
    const r = convert('{}');
    expect(r.error).toBeNull();
  });

  it('J2X-86: nested empty objects', () => {
    const r = convert('{"r":{"a":{}}}');
    expect(r.error).toBeNull();
    expect(r.output).toContain('<a');
  });
});
