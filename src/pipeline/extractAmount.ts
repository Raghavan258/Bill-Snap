import { moneyTokens } from './amounts';
import { linePriority } from './linePriority';
import { missing } from './text';
import type { Field, OcrDocument } from './types';

type Hit = { minor: number; priority: number };

const EXPLICIT_TOTAL = 80;
const LABELED_AMOUNT = 40;

/** Chooses the payable total. Tax, cash, and discount lines lose to an explicit total. */
export function extractAmount(doc: OcrDocument): Field<number> {
  const hits = collectHits(doc.lines.map((line) => line.text));
  const explicit = hits.filter((hit) => hit.priority >= EXPLICIT_TOTAL);
  if (explicit.length > 0) return chooseHit(explicit, 'high');
  const labeled = hits.filter((hit) => hit.priority >= LABELED_AMOUNT);
  if (labeled.length > 0) return chooseHit(labeled, 'low');
  return fromPlainAmounts(hits.filter((hit) => hit.priority === 0).map((hit) => hit.minor));
}

function collectHits(lines: string[]): Hit[] {
  const hits: Hit[] = [];
  lines.forEach((line, index) => addLineHits(lines, index, line, hits));
  return hits;
}

function addLineHits(lines: string[], index: number, line: string, hits: Hit[]): void {
  const priority = linePriority(line);
  const values = moneyTokens(line, priority >= EXPLICIT_TOTAL);
  values.forEach((minor) => hits.push({ minor, priority }));
  if (values.length === 0 && priority >= EXPLICIT_TOTAL) {
    addFollowingAmount(lines[index + 1], priority, hits);
    addFollowingAmount(lines[index - 1], priority, hits);
  }
}

function addFollowingAmount(line: string | undefined, priority: number, hits: Hit[]): void {
  if (!line) return;
  moneyTokens(line, true).forEach((minor) => hits.push({ minor, priority }));
}

function chooseHit(hits: Hit[], confidence: 'high' | 'low'): Field<number> {
  const ranked = [...hits].sort(byPriority);
  const winner = ranked[0];
  const conflict = ranked.some((hit) => hit.priority === winner.priority && hit.minor !== winner.minor);
  return { value: winner.minor, confidence: conflict ? 'low' : confidence };
}

function byPriority(left: Hit, right: Hit): number {
  return right.priority - left.priority || right.minor - left.minor;
}

function fromPlainAmounts(values: number[]): Field<number> {
  const summed = totalBySum(values);
  if (summed !== null) return { value: summed, confidence: 'high' };
  if (values.length === 1) return { value: values[0], confidence: 'high' };
  if (values.length > 1) return { value: Math.max(...values), confidence: 'low' };
  return missing();
}

function totalBySum(values: number[]): number | null {
  for (let index = 0; index < values.length; index += 1) {
    const others = values.filter((_, other) => other !== index);
    const sum = others.reduce((total, value) => total + value, 0);
    if (others.length >= 2 && sum === values[index]) return values[index];
  }
  return null;
}
