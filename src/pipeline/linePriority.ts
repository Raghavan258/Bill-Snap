import { keywordText } from './text';

const TOTAL_LINE = /grand total|net payable|amount payable|amount paid|balance due|net amount/;
const TAX_LINE = /cgst|sgst|igst|\bvat\b|\btax\b|discount|round off|\bchange\b|tender|\bcash\b/;

/** Higher numbers win. Tax, cash, and discount lines stay below an explicit total. */
export function linePriority(line: string): number {
  const key = keywordText(line);
  if (TOTAL_LINE.test(key)) return 100;
  if (/total amount/.test(key)) return 90;
  if (TAX_LINE.test(key)) return 10;
  if (/sub total|subtotal/.test(key)) return 20;
  if (/\btotal\b/.test(key)) return 80;
  if (/paid to|debited|\bamount\b/.test(key)) return 40;
  return 0;
}
