/**
 * Sample logo fixtures for upload tests.
 *
 * Kept inline as buffers/strings so we don't need binary files in the
 * repo. The PNG is the smallest possible valid PNG: a 1x1 transparent
 * pixel. The SVG is a tiny cyan square.
 */

const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=';

export const SAMPLE_PNG = {
  name: 'sample-logo.png',
  mimeType: 'image/png',
  buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
};

export const SAMPLE_SVG = {
  name: 'sample-logo.svg',
  mimeType: 'image/svg+xml',
  buffer: Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<rect width="32" height="32" fill="#22d3ee"/>' +
      '</svg>',
    'utf-8',
  ),
};

export const MALICIOUS_SVG = {
  name: 'malicious.svg',
  mimeType: 'image/svg+xml',
  buffer: Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    'utf-8',
  ),
};
