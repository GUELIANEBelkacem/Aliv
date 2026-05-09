import { describe, it, expect } from 'vitest';
import { xmlToJson, jsonToXml } from '../lib/converter';
import { opts } from './helpers';

// ─── 7. Options Interaction Tests ───────────────────────────────────

describe('options interaction', () => {
  it('OPT-1: alwaysArray + inferTypes (XML→JSON)', () => {
    const r = xmlToJson('<r><n>42</n></r>', opts({ alwaysArray: true, inferTypes: true }));
    expect(r.error).toBeNull();
    const parsed = JSON.parse(r.output);
    // n should be an array containing a number
    const nVal = parsed.r.n ?? parsed.r[0]?.n;
    expect(Array.isArray(nVal)).toBe(true);
    expect(nVal[0]).toBe(42);
  });

  it('OPT-2: preserveComments + preserveDeclaration (XML→JSON)', () => {
    const xml = '<?xml version="1.0"?><!-- comment --><r>v</r>';
    const r = xmlToJson(xml, opts({ preserveComments: true, preserveDeclaration: true }));
    expect(r.error).toBeNull();
    const parsed = JSON.parse(r.output);
    expect(parsed['?xml']).toBeDefined();
  });

  it('OPT-3: custom attributePrefix + custom textNodeName', () => {
    const r = xmlToJson('<r id="1">v</r>', opts({ attributePrefix: '$', textNodeName: '_text' }));
    expect(r.error).toBeNull();
    const parsed = JSON.parse(r.output);
    expect(parsed.r['$id']).toBe('1');
    expect(parsed.r['_text']).toBe('v');
  });

  it('OPT-4: alwaysArray + preserveComments (XML→JSON)', () => {
    const r = xmlToJson('<r><!-- c --><a>v</a></r>', opts({ alwaysArray: true, preserveComments: true }));
    expect(r.error).toBeNull();
    const parsed = JSON.parse(r.output);
    // Both comments and arrays should be present
    expect(parsed.r).toBeDefined();
  });

  it('OPT-5: 4-space indent (JSON→XML)', () => {
    const r = jsonToXml('{"r":{"a":"v"}}', opts({ indentation: '    ' }));
    expect(r.error).toBeNull();
    expect(r.output).toContain('    <a>');
  });

  it('OPT-6: tab indent (XML→JSON)', () => {
    const r = xmlToJson('<r><a>v</a></r>', opts({ indentation: '\t' }));
    expect(r.error).toBeNull();
    expect(r.output).toContain('\t"a"');
  });

  it('OPT-7: inferTypes off + attribute with number (XML→JSON)', () => {
    const r = xmlToJson('<r count="42"/>', opts({ inferTypes: false }));
    expect(r.error).toBeNull();
    const parsed = JSON.parse(r.output);
    expect(parsed.r['@_count']).toBe('42');
    expect(typeof parsed.r['@_count']).toBe('string');
  });

  it('OPT-8: inferTypes on + attribute with number (XML→JSON)', () => {
    const r = xmlToJson('<r count="42"/>', opts({ inferTypes: true }));
    expect(r.error).toBeNull();
    const parsed = JSON.parse(r.output);
    expect(parsed.r['@_count']).toBe(42);
    expect(typeof parsed.r['@_count']).toBe('number');
  });
});
