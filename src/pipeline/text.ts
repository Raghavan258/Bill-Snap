import type { OcrDocument } from './types';

const MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*';

export const DATE_PATTERN = new RegExp(
  `\\b\\d{1,2}[/\\-.]\\d{1,2}[/\\-.]\\d{2,4}\\b|\\b\\d{4}[/\\-.]\\d{1,2}[/\\-.]\\d{1,2}\\b|\\b\\d{1,2}\\s${MONTH}\\s\\d{2,4}\\b`,
  'ig',
);

export const GSTIN_PATTERN = /\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b/gi;

/** Letters-only copy used for keywords, so OCR swaps like T0tal still match. */
export function keywordText(value: string): string {
  return value.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'l').replace(/5/g, 's');
}

export function documentText(doc: OcrDocument): string {
  return doc.lines.map((line) => line.text).join('\n');
}

export function presentLines(doc: OcrDocument): string[] {
  return doc.lines.map((line) => line.text.trim()).filter((line) => line.length > 0);
}

export function missing<T>(): { value: null; confidence: 'missing' } {
  return { value: null, confidence: 'missing' };
}
