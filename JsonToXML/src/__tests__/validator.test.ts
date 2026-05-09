import { describe, it, expect } from 'vitest';
import { validateJson, validateXml } from '../lib/validator';

// ─── 5.1 validateJson ───────────────────────────────────────────────

describe('validateJson', () => {
  it('VJ-1: valid JSON object', () => {
    expect(validateJson('{"a": 1}')).toBeNull();
  });

  it('VJ-2: valid JSON array', () => {
    expect(validateJson('[1, 2]')).toBeNull();
  });

  it('VJ-3: valid JSON primitive', () => {
    expect(validateJson('"hello"')).toBeNull();
  });

  it('VJ-4: missing closing brace', () => {
    const err = validateJson('{"a": 1');
    expect(err).not.toBeNull();
    expect(err!.message).toBeTruthy();
  });

  it('VJ-5: error with position', () => {
    const err = validateJson('{"a": undefined}');
    expect(err).not.toBeNull();
    expect(err!.message).toBeTruthy();
  });

  it('VJ-6: trailing comma error', () => {
    const err = validateJson('{"a": 1,}');
    expect(err).not.toBeNull();
  });

  it('VJ-7: empty string', () => {
    const err = validateJson('');
    expect(err).not.toBeNull();
  });

  it('VJ-8: error message is a string', () => {
    const err = validateJson('{bad}');
    expect(err).not.toBeNull();
    expect(typeof err!.message).toBe('string');
  });
});

// ─── 5.2 validateXml ────────────────────────────────────────────────

describe('validateXml', () => {
  it('VX-1: valid XML', () => {
    expect(validateXml('<root><a/></root>')).toBeNull();
  });

  it('VX-2: self-closing', () => {
    expect(validateXml('<root/>')).toBeNull();
  });

  it('VX-3: with declaration', () => {
    expect(validateXml('<?xml version="1.0"?><r/>')).toBeNull();
  });

  it('VX-4: unclosed tag', () => {
    const err = validateXml('<root><a>');
    expect(err).not.toBeNull();
    expect(err!.message).toBeTruthy();
  });

  it('VX-5: mismatched tags', () => {
    const err = validateXml('<a></b>');
    expect(err).not.toBeNull();
  });

  it('VX-6: no root element', () => {
    const err = validateXml('plain text');
    expect(err).not.toBeNull();
  });

  it('VX-7: invalid character in tag name', () => {
    const err = validateXml('<123/>');
    expect(err).not.toBeNull();
  });

  it('VX-8: unescaped ampersand', () => {
    const err = validateXml('<r>a & b</r>');
    expect(err).not.toBeNull();
  });

  it('VX-9: empty string', () => {
    const err = validateXml('');
    expect(err).not.toBeNull();
  });
});
