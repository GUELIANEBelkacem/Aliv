export function prettifyJson(input: string, indent: string): string {
  return JSON.stringify(JSON.parse(input), null, indent);
}

export function minifyJson(input: string): string {
  return JSON.stringify(JSON.parse(input));
}

export function prettifyXml(input: string, indent: string): string {
  let formatted = '';
  let depth = 0;
  // Normalize: collapse whitespace between tags
  const xml = input.replace(/>\s+</g, '><').trim();
  const tokens = xml.match(/<[^>]+>|[^<]+/g);
  if (!tokens) return input;

  for (const token of tokens) {
    if (token.startsWith('</')) {
      // Closing tag
      depth--;
      formatted += indent.repeat(depth) + token + '\n';
    } else if (token.startsWith('<') && token.endsWith('/>')) {
      // Self-closing tag
      formatted += indent.repeat(depth) + token + '\n';
    } else if (token.startsWith('<?')) {
      // Declaration / processing instruction
      formatted += token + '\n';
    } else if (token.startsWith('<!--')) {
      // Comment
      formatted += indent.repeat(depth) + token + '\n';
    } else if (token.startsWith('<') && !token.startsWith('</')) {
      // Opening tag
      formatted += indent.repeat(depth) + token + '\n';
      depth++;
    } else {
      // Text content — attach to previous line
      const trimmed = token.trim();
      if (trimmed) {
        // Remove last newline and append text inline
        formatted = formatted.replace(/\n$/, '');
        formatted += trimmed + '\n';
        // The next closing tag should not add extra depth
      }
    }
  }

  // Fix inline text + closing tag: put closing tag on same line as text
  formatted = formatted.replace(/([^\n>])\n([ \t]*)(< \/)/g, '$1$3');

  return formatted.trimEnd();
}

export function minifyXml(input: string): string {
  return input
    .replace(/>\s+</g, '><')
    .replace(/^\s+|\s+$/gm, '')
    .replace(/\n/g, '');
}
