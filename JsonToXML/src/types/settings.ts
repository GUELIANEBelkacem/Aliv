export interface ConversionOptions {
  attributePrefix: string;
  textNodeName: string;
  preserveComments: boolean;
  preserveDeclaration: boolean;
  inferTypes: boolean;
  alwaysArray: boolean;
  indentation: string;
}

export interface AppSettings extends ConversionOptions {
  autoConvert: boolean;
  theme: 'light' | 'dark' | 'system';
}

export type ConversionDirection = 'json-to-xml' | 'xml-to-json' | 'auto';

export type DetectedFormat = 'json' | 'xml' | 'unknown';

export interface ConversionResult {
  output: string;
  error: ConversionError | null;
}

export interface ConversionError {
  message: string;
  line?: number;
  column?: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  attributePrefix: '@_',
  textNodeName: '#text',
  preserveComments: false,
  preserveDeclaration: false,
  inferTypes: false,
  alwaysArray: false,
  indentation: '  ',
  autoConvert: true,
  theme: 'dark',
};
