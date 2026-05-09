import type { ConversionOptions } from '../types/settings';

export const defaults: ConversionOptions = {
  attributePrefix: '@_',
  textNodeName: '#text',
  preserveComments: false,
  preserveDeclaration: false,
  inferTypes: false,
  alwaysArray: false,
  indentation: '  ',
};

export function opts(overrides: Partial<ConversionOptions> = {}): ConversionOptions {
  return { ...defaults, ...overrides };
}
