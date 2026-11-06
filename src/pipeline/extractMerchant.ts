import { parseReceiptDate } from '../domain/dates';
import { moneyTokens } from './amounts';
import { linePriority } from './linePriority';
import { GSTIN_PATTERN, missing } from './text';
import type { Field, OcrDocument, OcrLine } from './types';

const GENERIC = /^(tax invoice|invoice|receipt|cash memo|cash bill|original|duplicate|customer copy|merchant copy|original for recipient|payment successful|utility bill|electricity bill|electricity|welcome|bill to|ship to|gst invoice|hotel)$/i;
const LABEL = /^(bill no|invoice no|bill number|inv no|date|dated|dt|gstin|phone|mobile|mob)\b/i;
const ADDRESS = /\b(road|street|nagar|marg|floor|pincode|pin code|shop no|phone|mob|tel)\b/i;

/** Picks a merchant from a payment line or the first heading that is not a label. */
export function extractMerchant(doc: OcrDocument): Field<string> {
  const paid = merchantFromPayment(doc.lines);
  if (paid) return { value: paid, confidence: 'high' };
  const candidates = doc.lines.filter((line) => keepMerchantLine(line)).slice(0, 3);
  const candidate = candidates[0];
  if (!candidate) return missing();
  return { value: cleanMerchant(candidate.text), confidence: candidates.length > 1 ? 'low' : 'high' };
}

function merchantFromPayment(lines: OcrLine[]): string | null {
  for (const line of lines) {
    const match = line.text.match(/paid\s+to\s+([A-Za-z0-9&.' -]{2,60})/i);
    if (match?.[1]) return cleanMerchant(match[1]);
  }
  return null;
}

function keepMerchantLine(line: OcrLine): boolean {
  return !skipMerchant(line.text);
}

function skipMerchant(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || GENERIC.test(trimmed) || LABEL.test(trimmed)) return true;
  if (parseReceiptDate(trimmed) || new RegExp(GSTIN_PATTERN.source, 'i').test(trimmed)) return true;
  if (ADDRESS.test(trimmed) || /thank you|visit again/i.test(trimmed)) return true;
  if (linePriority(trimmed) >= 10 || moneyTokens(trimmed, false).length > 0) return true;
  if ((trimmed.match(/\d/g) ?? []).length >= 6) return true;
  return trimmed.replace(/[^A-Za-z]/g, '').length < 3;
}

function cleanMerchant(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/[|,:;-]+$/g, '').trim();
}
