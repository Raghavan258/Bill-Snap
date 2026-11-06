import { parseReceiptDate } from '../domain/dates';
import { moneyTokens } from './amounts';
import { linePriority } from './linePriority';
import { keywordText, presentLines } from './text';
import type { BillDecision, Classification, OcrDocument, RejectReason } from './types';

const MIN_CHARS = 40;
const MIN_LINES = 4;

const INVOICE = /\b(tax invoice|invoice|receipt|cash memo|bill no|bill number)\b/;
const TOTAL = /\b(grand total|net payable|amount payable|amount paid|balance due|net amount|total amount|subtotal|sub total|total)\b/;
const TAX = /\b(cgst|sgst|igst|gst|vat)\b/;
const PAYMENT = /\b(paid to|payment successful|transaction successful|upi ref|debited)\b/;
const PAYMENT_HINT = /\b(upi|paid|payment|debited|txn|transaction id)\b/;
const IDENTITY = /\b(aadhaar|aadhar|uidai|passport|driving licen[cs]e|voter id|permanent account|date of birth|dob|pan card)\b/;
const SOCIAL = /\b(whatsapp|instagram|facebook|telegram|snapchat|type a message|stories)\b/;
const MENU = /\bmenu\b/;

/** Decides accepted, needs review, or rejected. Text alone is not enough. */
export function classifyBill(doc: OcrDocument): Classification {
  const lines = presentLines(doc);
  const raw = lines.join('\n');
  const key = keywordText(raw);
  const signals = collectSignals(raw, key);
  const strong = isStrongReceipt(signals);
  const decision = decide(key, lines, raw, signals, strong);
  return {
    isBill: decision !== 'rejected',
    decision,
    reason: decision === 'rejected' ? (rejectReason(key, lines, raw, signals, strong) ?? 'not-a-receipt') : null,
    signals,
  };
}

export function rejectionMessage(reason: RejectReason): string {
  if (reason === 'identity-document') {
    return 'This looks like an identity document, not a purchase bill. Try a photo of a receipt.';
  }
  if (reason === 'low-text') {
    return "This doesn't look like a bill. Photos without receipt text can't be saved as expenses.";
  }
  if (reason === 'app-screenshot') {
    return 'This looks like a screenshot from another app, not a purchase bill. Try a receipt image.';
  }
  return "This image doesn't look like a purchase bill or receipt. You can try another image.";
}

function decide(
  key: string,
  lines: string[],
  raw: string,
  signals: string[],
  strong: boolean,
): BillDecision {
  const blocked = blockedReason(key, strong);
  if (blocked) return 'rejected';
  if (strong || isStructuredInvoice(signals, lines.length)) return 'accepted';
  if (plausibleReceipt(key, lines, raw, signals)) return 'needs-review';
  return 'rejected';
}

function blockedReason(key: string, strong: boolean): RejectReason | null {
  if (IDENTITY.test(key) && !strong) return 'identity-document';
  if (MENU.test(key) && !strong) return 'not-a-receipt';
  if (SOCIAL.test(key) && !strong) return 'app-screenshot';
  return null;
}

function plausibleReceipt(key: string, lines: string[], raw: string, signals: string[]): boolean {
  if (!signals.includes('money') || lines.length < 2) return false;
  if (lines.length > 14 && !signals.includes('date') && !PAYMENT_HINT.test(key)) return false;
  if (raw.trim().length < 12) return false;
  return true;
}

function rejectReason(
  key: string,
  lines: string[],
  raw: string,
  signals: string[],
  strong: boolean,
): RejectReason | null {
  if (IDENTITY.test(key) && !strong) return 'identity-document';
  if (SOCIAL.test(key) && !strong) return 'app-screenshot';
  if (raw.trim().length < MIN_CHARS && lines.length < MIN_LINES && !strong) return 'low-text';
  if (!strong && !isStructuredInvoice(signals, lines.length)) return 'not-a-receipt';
  return null;
}

function collectSignals(raw: string, key: string): string[] {
  const signals: string[] = [];
  if (INVOICE.test(key)) signals.push('invoice');
  if (TOTAL.test(key)) signals.push('total');
  if (TAX.test(key)) signals.push('tax');
  if (PAYMENT.test(key)) signals.push('payment');
  if (gstin(raw)) signals.push('gstin');
  if (linesHaveDate(raw)) signals.push('date');
  if (hasReceiptMoney(raw)) signals.push('money');
  return signals;
}

function isStrongReceipt(signals: string[]): boolean {
  const has = (name: string) => signals.includes(name);
  if (has('gstin')) return true;
  return has('money') && (has('total') || has('invoice') || has('tax') || has('payment'));
}

function isStructuredInvoice(signals: string[], lineCount: number): boolean {
  return signals.includes('invoice') && signals.includes('date') && lineCount >= MIN_LINES;
}

function linesHaveDate(raw: string): boolean {
  return raw.split('\n').some((line) => parseReceiptDate(line) !== null);
}

function hasReceiptMoney(raw: string): boolean {
  return raw.split('\n').some((line) => lineHasReceiptMoney(line));
}

function lineHasReceiptMoney(line: string): boolean {
  if (moneyTokens(line, false).length > 0) return true;
  const compactTotal = line.trim().length <= 24 && linePriority(line) >= 80;
  return compactTotal && moneyTokens(line, true).length > 0;
}

function gstin(raw: string): boolean {
  return /\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b/i.test(raw);
}
