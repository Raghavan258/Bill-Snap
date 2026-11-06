import { parseReceiptDate } from '../domain/dates';
import { keywordText, missing } from './text';
import type { Field, OcrDocument } from './types';

type DateHit = { iso: string; ambiguous: boolean; labeled: boolean };

/** Prefers a date that sits on a line labelled date, dated, or dt. */
export function extractDate(doc: OcrDocument): Field<string> {
  const hits = doc.lines.flatMap((line) => toHit(line.text));
  if (hits.length === 0) return missing();
  const labeled = hits.filter((hit) => hit.labeled);
  const pool = labeled.length > 0 ? labeled : hits;
  return chooseDate(pool);
}

function toHit(line: string): DateHit[] {
  const parsed = parseReceiptDate(line);
  if (!parsed) return [];
  const labeled = /\b(date|dated|dt)\b/.test(keywordText(line));
  return [{ iso: parsed.iso, ambiguous: parsed.ambiguous, labeled }];
}

function chooseDate(pool: DateHit[]): Field<string> {
  const chosen = pool[0];
  const distinct = new Set(pool.map((hit) => hit.iso));
  const confidence = distinct.size > 1 || chosen.ambiguous ? 'low' : 'high';
  return { value: chosen.iso, confidence };
}
