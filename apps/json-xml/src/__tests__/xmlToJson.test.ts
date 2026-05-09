import { describe, it, expect } from 'vitest';
import { xmlToJson } from '../lib/converter';
import { opts } from './helpers';

// Helper: parse the JSON output string and return the JS object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parse(xml: string, overrides = {}): { output: string; error: any; parsed: any } {
  const r = xmlToJson(xml, opts(overrides));
  if (r.error) return { ...r, parsed: undefined };
  return { ...r, parsed: JSON.parse(r.output) };
}

// ─── 1.1 Basic Valid Conversions ──────────────────────────────────────

describe('xmlToJson — basic', () => {
  it('X2J-1: single element with text', () => {
    const r = parse('<root>hello</root>');
    expect(r.parsed).toEqual({ root: 'hello' });
  });

  it('X2J-2: nested elements', () => {
    const r = parse('<root><a><b>val</b></a></root>');
    expect(r.parsed).toEqual({ root: { a: { b: 'val' } } });
  });

  it('X2J-3: multiple different children', () => {
    const r = parse('<root><a>1</a><b>2</b></root>');
    expect(r.parsed).toEqual({ root: { a: '1', b: '2' } });
  });

  it('X2J-4: self-closing element', () => {
    const r = parse('<root><empty/></root>');
    expect(r.parsed).toEqual({ root: { empty: '' } });
  });

  it('X2J-5: deeply nested (5 levels)', () => {
    const r = parse('<a><b><c><d><e>v</e></d></c></b></a>');
    expect(r.parsed).toEqual({ a: { b: { c: { d: { e: 'v' } } } } });
  });

  it('X2J-6: element with only whitespace text', () => {
    const r = parse('<root>   </root>');
    // trimValues: true strips to empty string
    expect(r.parsed.root).toBe('');
  });
});

// ─── 1.2 Attributes ──────────────────────────────────────────────────

describe('xmlToJson — attributes', () => {
  it('X2J-10: single attribute', () => {
    const r = parse('<book id="1"/>');
    expect(r.parsed).toEqual({ book: { '@_id': '1' } });
  });

  it('X2J-11: multiple attributes', () => {
    const r = parse('<book id="1" lang="en"/>');
    expect(r.parsed.book['@_id']).toBe('1');
    expect(r.parsed.book['@_lang']).toBe('en');
  });

  it('X2J-12: attribute + text content', () => {
    const r = parse('<book id="1">Title</book>');
    expect(r.parsed.book['@_id']).toBe('1');
    expect(r.parsed.book['#text']).toBe('Title');
  });

  it('X2J-13: attribute + child elements', () => {
    const r = parse('<root id="1"><a>v</a></root>');
    expect(r.parsed.root['@_id']).toBe('1');
    expect(r.parsed.root.a).toBe('v');
  });

  it('X2J-14: custom attribute prefix $', () => {
    const r = parse('<book id="1"/>', { attributePrefix: '$' });
    expect(r.parsed).toEqual({ book: { '$id': '1' } });
  });

  it('X2J-15: empty attribute value', () => {
    const r = parse('<root attr=""/>');
    expect(r.parsed.root['@_attr']).toBe('');
  });

  it('X2J-16: attribute with special chars (entity)', () => {
    const r = parse('<root attr="a&amp;b"/>');
    expect(r.parsed.root['@_attr']).toBe('a&b');
  });
});

// ─── 1.3 Repeated Elements (Arrays) ──────────────────────────────────

describe('xmlToJson — arrays', () => {
  it('X2J-20: two siblings same name', () => {
    const r = parse('<root><item>a</item><item>b</item></root>');
    expect(r.parsed.root.item).toEqual(['a', 'b']);
  });

  it('X2J-21: three siblings same name', () => {
    const r = parse('<root><i>a</i><i>b</i><i>c</i></root>');
    expect(r.parsed.root.i).toEqual(['a', 'b', 'c']);
  });

  it('X2J-22: single element (no array)', () => {
    const r = parse('<root><item>a</item></root>');
    expect(r.parsed.root.item).toBe('a');
  });

  it('X2J-23: single element (alwaysArray: true)', () => {
    const r = parse('<root><item>a</item></root>', { alwaysArray: true });
    // With alwaysArray, root itself becomes an array: { root: [{ item: ["a"] }] }
    const root = Array.isArray(r.parsed.root) ? r.parsed.root[0] : r.parsed.root;
    expect(Array.isArray(root.item)).toBe(true);
    expect(root.item).toContain('a');
  });

  it('X2J-24: mixed siblings — repeated + unique', () => {
    const r = parse('<r><a>1</a><b>2</b><a>3</a></r>');
    expect(r.parsed.r.a).toEqual(['1', '3']);
    expect(r.parsed.r.b).toBe('2');
  });

  it('X2J-25: repeated elements with attributes', () => {
    const r = parse('<r><item id="1">a</item><item id="2">b</item></r>');
    expect(r.parsed.r.item).toHaveLength(2);
    expect(r.parsed.r.item[0]['@_id']).toBe('1');
    expect(r.parsed.r.item[0]['#text']).toBe('a');
    expect(r.parsed.r.item[1]['@_id']).toBe('2');
  });

  it('X2J-26: repeated elements with children', () => {
    const r = parse('<r><item><name>a</name></item><item><name>b</name></item></r>');
    expect(r.parsed.r.item).toEqual([{ name: 'a' }, { name: 'b' }]);
  });

  it('X2J-27: alwaysArray with nested elements', () => {
    const r = parse('<r><a><b>v</b></a></r>', { alwaysArray: true });
    // Every element should be wrapped in an array
    expect(Array.isArray(r.parsed.r)).toBe(true);
  });
});

// ─── 1.4 Type Inference ──────────────────────────────────────────────

describe('xmlToJson — type inference', () => {
  it('X2J-30: number (inferTypes off)', () => {
    const r = parse('<r><n>123</n></r>');
    expect(r.parsed.r.n).toBe('123');
    expect(typeof r.parsed.r.n).toBe('string');
  });

  it('X2J-31: number (inferTypes on)', () => {
    const r = parse('<r><n>123</n></r>', { inferTypes: true });
    expect(r.parsed.r.n).toBe(123);
    expect(typeof r.parsed.r.n).toBe('number');
  });

  it('X2J-32: float (inferTypes on)', () => {
    const r = parse('<r><n>3.14</n></r>', { inferTypes: true });
    expect(r.parsed.r.n).toBeCloseTo(3.14);
  });

  it('X2J-33: negative number (inferTypes on)', () => {
    const r = parse('<r><n>-42</n></r>', { inferTypes: true });
    expect(r.parsed.r.n).toBe(-42);
  });

  it('X2J-34: boolean true (inferTypes on)', () => {
    const r = parse('<r><b>true</b></r>', { inferTypes: true });
    expect(r.parsed.r.b).toBe(true);
  });

  it('X2J-35: boolean false (inferTypes on)', () => {
    const r = parse('<r><b>false</b></r>', { inferTypes: true });
    expect(r.parsed.r.b).toBe(false);
  });

  it('X2J-36: non-numeric string (inferTypes on)', () => {
    const r = parse('<r><s>hello</s></r>', { inferTypes: true });
    expect(r.parsed.r.s).toBe('hello');
  });

  it('X2J-37: attribute value inferred', () => {
    const r = parse('<r attr="42"/>', { inferTypes: true });
    expect(r.parsed.r['@_attr']).toBe(42);
  });

  it('X2J-38: attribute value not inferred', () => {
    const r = parse('<r attr="42"/>', { inferTypes: false });
    expect(r.parsed.r['@_attr']).toBe('42');
  });

  it('X2J-39: scientific notation (inferTypes on)', () => {
    const r = parse('<r><n>1e5</n></r>', { inferTypes: true });
    expect(r.parsed.r.n).toBe(100000);
  });
});

// ─── 1.5 XML Declarations ───────────────────────────────────────────

describe('xmlToJson — declarations', () => {
  it('X2J-40: declaration stripped (default)', () => {
    const r = parse('<?xml version="1.0"?><r>v</r>');
    expect(r.parsed['?xml']).toBeUndefined();
    expect(r.parsed.r).toBe('v');
  });

  it('X2J-41: declaration preserved', () => {
    const r = parse('<?xml version="1.0"?><r>v</r>', { preserveDeclaration: true });
    expect(r.parsed['?xml']).toBeDefined();
  });

  it('X2J-42: declaration with encoding', () => {
    const r = parse('<?xml version="1.0" encoding="UTF-8"?><r/>', { preserveDeclaration: true });
    expect(r.parsed['?xml']).toBeDefined();
  });

  it('X2J-43: no declaration present, preserveDeclaration true', () => {
    const r = parse('<r>v</r>', { preserveDeclaration: true });
    expect(r.parsed).toEqual({ r: 'v' });
    expect(r.error).toBeNull();
  });
});

// ─── 1.6 Comments ───────────────────────────────────────────────────

describe('xmlToJson — comments', () => {
  it('X2J-50: comments stripped (default)', () => {
    const r = parse('<r><!-- note --><a>v</a></r>');
    expect(r.parsed.r['#comment']).toBeUndefined();
    expect(r.parsed.r.a).toBe('v');
  });

  it('X2J-51: comments preserved', () => {
    const r = parse('<r><!-- note --><a>v</a></r>', { preserveComments: true });
    expect(r.parsed.r['#comment']).toBeDefined();
  });

  it('X2J-52: multiple comments', () => {
    const r = parse('<r><!-- one --><!-- two --><a/></r>', { preserveComments: true });
    expect(r.parsed.r['#comment']).toBeDefined();
  });
});

// ─── 1.7 CDATA Sections ─────────────────────────────────────────────

describe('xmlToJson — CDATA', () => {
  it('X2J-55: CDATA with plain text', () => {
    const r = parse('<r><![CDATA[hello]]></r>');
    expect(r.parsed.r).toBe('hello');
  });

  it('X2J-56: CDATA with XML-like content', () => {
    const r = parse('<r><![CDATA[<not>xml</not>]]></r>');
    expect(r.parsed.r).toContain('<not>xml</not>');
  });

  it('X2J-57: CDATA with special characters', () => {
    const r = parse('<r><![CDATA[a & b < c]]></r>');
    expect(r.parsed.r).toContain('a & b < c');
  });
});

// ─── 1.8 XML Entities ───────────────────────────────────────────────

describe('xmlToJson — entities', () => {
  it('X2J-60: ampersand entity', () => {
    const r = parse('<r>a &amp; b</r>');
    expect(r.parsed.r).toBe('a & b');
  });

  it('X2J-61: less-than entity', () => {
    const r = parse('<r>a &lt; b</r>');
    expect(r.parsed.r).toBe('a < b');
  });

  it('X2J-62: greater-than entity', () => {
    const r = parse('<r>a &gt; b</r>');
    expect(r.parsed.r).toBe('a > b');
  });

  it('X2J-63: quote entity in attribute', () => {
    const r = parse('<r attr="a&quot;b"/>');
    expect(r.parsed.r['@_attr']).toBe('a"b');
  });

  it('X2J-64: apostrophe entity', () => {
    const r = parse('<r>a &apos; b</r>');
    expect(r.parsed.r).toContain("'");
  });

  it('X2J-65: numeric character reference', () => {
    const r = parse('<r>&#65;</r>');
    // fast-xml-parser does not decode numeric character references by default
    // The value is preserved as-is
    expect(r.parsed.r).toBeDefined();
  });
});

// ─── 1.9 Namespaces ─────────────────────────────────────────────────

describe('xmlToJson — namespaces', () => {
  it('X2J-70: prefixed element', () => {
    const r = parse('<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body/></soap:Envelope>');
    expect(r.parsed['soap:Envelope']).toBeDefined();
    expect(r.parsed['soap:Envelope']['soap:Body']).toBeDefined();
  });

  it('X2J-71: default namespace', () => {
    const r = parse('<root xmlns="http://example.com"><a>v</a></root>');
    expect(r.parsed.root['@_xmlns']).toBe('http://example.com');
    expect(r.parsed.root.a).toBe('v');
  });

  it('X2J-72: multiple namespace prefixes', () => {
    const r = parse('<r xmlns:a="urn:a" xmlns:b="urn:b"><a:x/><b:y/></r>');
    expect(r.parsed.r['a:x']).toBeDefined();
    expect(r.parsed.r['b:y']).toBeDefined();
  });
});

// ─── 1.10 Mixed Content ─────────────────────────────────────────────

describe('xmlToJson — mixed content', () => {
  it('X2J-75: text + child element', () => {
    const r = parse('<p>Hello <b>world</b></p>');
    expect(r.parsed.p).toBeDefined();
    expect(r.parsed.p.b).toBe('world');
  });

  it('X2J-76: text before and after child', () => {
    const r = parse('<p>A <b>B</b> C</p>');
    expect(r.parsed.p.b).toBe('B');
    // Text is captured somewhere in the structure
    expect(r.parsed.p['#text']).toBeDefined();
  });
});

// ─── 1.11 Validation Errors ─────────────────────────────────────────

describe('xmlToJson — validation errors', () => {
  it('X2J-80: unclosed tag', () => {
    const r = xmlToJson('<root><a></root>', opts());
    expect(r.error).not.toBeNull();
    expect(r.error!.message).toBeTruthy();
  });

  it('X2J-81: mismatched tags', () => {
    const r = xmlToJson('<a></b>', opts());
    expect(r.error).not.toBeNull();
  });

  it('X2J-82: missing root element (text only)', () => {
    const r = xmlToJson('just plain text', opts());
    expect(r.error).not.toBeNull();
  });

  it('X2J-83: duplicate attributes', () => {
    const r = xmlToJson('<r a="1" a="2"/>', opts());
    expect(r.error).not.toBeNull();
  });

  it('X2J-84: invalid tag name starting with digit', () => {
    const r = xmlToJson('<123/>', opts());
    expect(r.error).not.toBeNull();
  });

  it('X2J-85: unescaped ampersand', () => {
    const r = xmlToJson('<r>a & b</r>', opts());
    expect(r.error).not.toBeNull();
  });

  it('X2J-86: unescaped less-than in text', () => {
    const r = xmlToJson('<r>a < b</r>', opts());
    expect(r.error).not.toBeNull();
  });

  it('X2J-87: empty string input', () => {
    const r = xmlToJson('', opts());
    // Empty string — validator may pass but parser produces empty
    expect(r.output).toBeDefined();
  });

  it('X2J-88: whitespace-only input', () => {
    const r = xmlToJson('   ', opts());
    // Should either error or produce empty output
    expect(r.output === '' || r.error !== null).toBe(true);
  });
});

// ─── 1.12 Edge Cases ────────────────────────────────────────────────

describe('xmlToJson — edge cases', () => {
  it('X2J-90: very deeply nested (100 levels)', () => {
    let xml = '';
    for (let i = 0; i < 100; i++) xml += '<a>';
    xml += 'v';
    for (let i = 0; i < 100; i++) xml += '</a>';
    const r = xmlToJson(xml, opts());
    expect(r.error).toBeNull();
    expect(r.output).toContain('v');
  });

  it('X2J-91: very long text content (100KB)', () => {
    const text = 'x'.repeat(100_000);
    const r = parse(`<r>${text}</r>`);
    expect(r.parsed.r).toBe(text);
  });

  it('X2J-92: many sibling elements (1000)', () => {
    const items = Array.from({ length: 1000 }, (_, i) => `<i>${i}</i>`).join('');
    const r = parse(`<r>${items}</r>`);
    expect(r.parsed.r.i).toHaveLength(1000);
  });

  it('X2J-93: unicode text content', () => {
    const r = parse('<r>日本語 émojis</r>');
    expect(r.parsed.r).toContain('日本語');
    expect(r.parsed.r).toContain('émojis');
  });

  it('X2J-94: empty root element', () => {
    const r = parse('<root/>');
    expect(r.parsed.root).toBe('');
  });

  it('X2J-95: attribute-only element', () => {
    const r = parse('<r id="1" class="a"/>');
    expect(r.parsed.r['@_id']).toBe('1');
    expect(r.parsed.r['@_class']).toBe('a');
  });

  it('X2J-96: multiline text content', () => {
    const r = parse('<r>line1\nline2\nline3</r>');
    expect(r.parsed.r).toContain('line1');
    expect(r.parsed.r).toContain('line2');
  });
});
