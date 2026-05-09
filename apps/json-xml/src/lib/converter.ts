import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import type { ConversionOptions, ConversionResult } from '../types/settings';

export function xmlToJson(xml: string, options: ConversionOptions): ConversionResult {
  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    return {
      output: '',
      error: {
        message: validation.err.msg,
        line: validation.err.line,
        column: validation.err.col,
      },
    };
  }

  try {
    const parser = new XMLParser({
      attributeNamePrefix: options.attributePrefix,
      textNodeName: options.textNodeName,
      ignoreAttributes: false,
      commentPropName: options.preserveComments ? '#comment' : undefined,
      preserveOrder: false,
      parseAttributeValue: options.inferTypes,
      parseTagValue: options.inferTypes,
      trimValues: true,
      isArray: () => options.alwaysArray,
    });

    const parsed = parser.parse(xml);

    // Remove declaration key if not preserving
    if (!options.preserveDeclaration && parsed['?xml']) {
      delete parsed['?xml'];
    }

    const json = JSON.stringify(parsed, null, options.indentation);
    return { output: json, error: null };
  } catch (e) {
    return {
      output: '',
      error: { message: e instanceof Error ? e.message : String(e) },
    };
  }
}

export function jsonToXml(json: string, options: ConversionOptions): ConversionResult {
  try {
    const parsed = JSON.parse(json);

    // Wrap arrays or multi-key top-level objects in a root element
    let obj = parsed;
    if (Array.isArray(parsed)) {
      obj = { root: { item: parsed } };
    } else if (typeof parsed !== 'object' || parsed === null) {
      obj = { root: { [options.textNodeName]: String(parsed) } };
    }

    const builder = new XMLBuilder({
      attributeNamePrefix: options.attributePrefix,
      textNodeName: options.textNodeName,
      ignoreAttributes: false,
      commentPropName: options.preserveComments ? '#comment' : undefined,
      format: true,
      indentBy: options.indentation,
      suppressEmptyNode: false,
      processEntities: true,
    });

    let xmlOutput: string = builder.build(obj);

    if (options.preserveDeclaration) {
      xmlOutput = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlOutput}`;
    }

    return { output: xmlOutput.trimEnd(), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Try to extract line/column from JSON parse errors
    const match = msg.match(/position\s+(\d+)/i);
    let line: number | undefined;
    let column: number | undefined;
    if (match) {
      const pos = parseInt(match[1], 10);
      const before = json.slice(0, pos);
      line = (before.match(/\n/g)?.length ?? 0) + 1;
      column = pos - before.lastIndexOf('\n');
    }
    return { output: '', error: { message: msg, line, column } };
  }
}
