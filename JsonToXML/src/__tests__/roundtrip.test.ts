import { describe, it, expect } from 'vitest';
import { xmlToJson, jsonToXml } from '../lib/converter';
import { opts } from './helpers';

function j2x2j(json: string, overrides = {}) {
  const o = opts(overrides);
  const xmlResult = jsonToXml(json, o);
  expect(xmlResult.error).toBeNull();
  const jsonResult = xmlToJson(xmlResult.output, o);
  expect(jsonResult.error).toBeNull();
  return JSON.parse(jsonResult.output);
}

function x2j2x(xml: string, overrides = {}) {
  const o = opts(overrides);
  const jsonResult = xmlToJson(xml, o);
  expect(jsonResult.error).toBeNull();
  const xmlResult = jsonToXml(jsonResult.output, o);
  expect(xmlResult.error).toBeNull();
  return xmlResult.output;
}

// ─── 3.1 JSON → XML → JSON ──────────────────────────────────────────

describe('round-trip: JSON → XML → JSON', () => {
  it('RT-1: simple object', () => {
    const original = { root: { a: '1', b: '2' } };
    const result = j2x2j(JSON.stringify(original));
    expect(result).toEqual(original);
  });

  it('RT-2: object with attributes', () => {
    const original = { r: { '@_id': '1', '#text': 'v' } };
    const result = j2x2j(JSON.stringify(original));
    expect(result).toEqual(original);
  });

  it('RT-3: array', () => {
    const original = { r: { item: ['a', 'b'] } };
    const result = j2x2j(JSON.stringify(original));
    expect(result).toEqual(original);
  });

  it('RT-4: single-element array collapses to scalar (lossy)', () => {
    const original = { r: { item: ['a'] } };
    const result = j2x2j(JSON.stringify(original));
    // Known fidelity loss: single array element becomes scalar
    expect(result.r.item).toBe('a');
    expect(result.r.item).not.toEqual(['a']);
  });

  it('RT-5: single-element array preserved with alwaysArray', () => {
    const original = { r: { item: ['a'] } };
    const result = j2x2j(JSON.stringify(original), { alwaysArray: true });
    expect(Array.isArray(result.r.item) || Array.isArray(result.r[0]?.item)).toBe(true);
  });

  it('RT-6: numeric value becomes string (lossy)', () => {
    const result = j2x2j('{"r":{"n":42}}');
    // Known fidelity loss: number → string
    expect(result.r.n).toBe('42');
  });

  it('RT-7: numeric value preserved with inferTypes', () => {
    const result = j2x2j('{"r":{"n":42}}', { inferTypes: true });
    expect(result.r.n).toBe(42);
  });

  it('RT-8: boolean value becomes string (lossy)', () => {
    const result = j2x2j('{"r":{"b":true}}');
    expect(result.r.b).toBe('true');
  });

  it('RT-9: boolean value preserved with inferTypes', () => {
    const result = j2x2j('{"r":{"b":true}}', { inferTypes: true });
    expect(result.r.b).toBe(true);
  });

  it('RT-10: null value is lossy', () => {
    const result = j2x2j('{"r":{"n":null}}');
    // null has no XML equivalent — value will change
    expect(result.r.n).not.toBe(null);
  });

  it('RT-11: top-level array is lossy (wrapping added)', () => {
    const result = j2x2j('[1,2,3]');
    // Wrapping in <root><item> changes the structure
    expect(result.root).toBeDefined();
    expect(result).not.toEqual([1, 2, 3]);
  });
});

// ─── 3.2 XML → JSON → XML ──────────────────────────────────────────

describe('round-trip: XML → JSON → XML', () => {
  it('RT-20: simple element', () => {
    const result = x2j2x('<root><a>v</a></root>');
    expect(result).toContain('<a>v</a>');
    expect(result).toContain('<root>');
  });

  it('RT-21: element with attributes', () => {
    const result = x2j2x('<r id="1"><a>v</a></r>');
    expect(result).toContain('id="1"');
    expect(result).toContain('<a>v</a>');
  });

  it('RT-22: repeated elements', () => {
    const result = x2j2x('<r><i>a</i><i>b</i></r>');
    expect(result).toContain('<i>a</i>');
    expect(result).toContain('<i>b</i>');
  });

  it('RT-23: XML declaration is lost (default)', () => {
    const result = x2j2x('<?xml version="1.0"?><r>v</r>');
    expect(result).not.toContain('<?xml');
  });

  it('RT-24: XML declaration preserved with both flags', () => {
    const result = x2j2x('<?xml version="1.0" encoding="UTF-8"?><r>v</r>', {
      preserveDeclaration: true,
    });
    expect(result).toContain('<?xml');
  });

  it('RT-25: comments are lost (default)', () => {
    const result = x2j2x('<r><!-- note --><a>v</a></r>');
    expect(result).not.toContain('<!--');
  });

  it('RT-26: CDATA wrapper is lost', () => {
    const result = x2j2x('<r><![CDATA[content]]></r>');
    // CDATA unwrapped to plain text, not re-wrapped
    expect(result).toContain('content');
    expect(result).not.toContain('CDATA');
  });

  it('RT-27: whitespace formatting changes', () => {
    const original = '<r>\n  <a>v</a>\n</r>';
    const result = x2j2x(original);
    // Content preserved, but exact whitespace may differ
    expect(result).toContain('<a>v</a>');
  });

  it('RT-28: mixed content structure altered', () => {
    const original = '<p>Hello <b>world</b></p>';
    const result = x2j2x(original);
    // Mixed content has no clean round-trip — content may reorder
    expect(result).toContain('world');
  });

  it('RT-29: namespace prefixes preserved', () => {
    const original = '<s:Envelope xmlns:s="urn:test"><s:Body>v</s:Body></s:Envelope>';
    const result = x2j2x(original);
    expect(result).toContain('s:Envelope');
    expect(result).toContain('s:Body');
  });
});
