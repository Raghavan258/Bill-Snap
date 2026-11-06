import { parseAmountToMinor } from '../domain/money';
import { DATE_PATTERN, GSTIN_PATTERN } from './text';

const CURRENCY = /(?:₹|rs\.?|inr)\s*(\d{1,7}(?:,\d{2,3})*(?:\.\d{1,2})?)/gi;
const DECIMAL = /\b(\d{1,3}(?:,\d{2,3})+|\d{1,7})\.(\d{2})\b/g;
const INTEGER = /\b\d{1,6}\b/g;
const GROUPED = /\b\d{1,3}(?:,\d{2,3})+\b/g;

/** Reads currency and decimal amounts. Integers are included only for total lines. */
export function moneyTokens(line: string, allowIntegers: boolean): number[] {
  const withoutIds = stripIdsAndDates(line);
  const found = [...currencyAmounts(withoutIds), ...decimalAmounts(withoutIds)];
  if (allowIntegers) {
    const plain = stripAmounts(withoutIds);
    found.push(...groupedAmounts(plain), ...integerAmounts(plain));
  }
  return [...new Set(found)];
}

function stripIdsAndDates(line: string): string {
  return line.replace(clone(GSTIN_PATTERN), ' ').replace(clone(DATE_PATTERN), ' ');
}

function stripAmounts(line: string): string {
  return line.replace(clone(CURRENCY), ' ').replace(clone(DECIMAL), ' ');
}

function clone(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags);
}

function currencyAmounts(line: string): number[] {
  return collect(line, CURRENCY, (match) => match[1]);
}

function decimalAmounts(line: string): number[] {
  return collect(line, DECIMAL, (match) => `${match[1]}.${match[2]}`);
}

function groupedAmounts(line: string): number[] {
  return collect(line, GROUPED, (match) => match[0]);
}

function integerAmounts(line: string): number[] {
  const found: number[] = [];
  for (const match of line.matchAll(INTEGER)) {
    const raw = match[0];
    const year = Number(raw);
    if (raw.length === 4 && year >= 1900 && year <= 2100) continue;
    const minor = parseAmountToMinor(raw);
    if (minor !== null) found.push(minor);
  }
  return found;
}

function collect(line: string, pattern: RegExp, pick: (match: RegExpMatchArray) => string): number[] {
  const found: number[] = [];
  const flags = pattern.flags.includes('g') ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
  for (const match of line.matchAll(flags)) {
    const minor = parseAmountToMinor(pick(match));
    if (minor !== null) found.push(minor);
  }
  return found;
}
