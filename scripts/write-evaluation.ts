import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { formatMinor } from '../src/domain/money';
import type { Reading } from '../src/pipeline/interpretOcr';
import { EVAL_CASES, runCase, type EvalCase } from '../tests/fixtures';

const destination = resolve('docs/EVALUATION.md');

const lines = [
  '# Bill Snap evaluation',
  '',
  'These 20 cases were run through `interpretOcr`, the same classification and extraction functions the app uses after OCR.',
  'They are OCR transcripts, not photographs. On-device ML Kit output will differ on a real camera image.',
  'Nothing in this table was typed in by hand after the run; `npm run evaluate` regenerated it.',
  '',
  '| Image | Actual | Predicted | Merchant | Date | Amount | Category | Notes |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...EVAL_CASES.map((item) => row(item, runCase(item))),
  '',
];

mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, lines.join('\n'), 'utf8');
process.stdout.write(`Wrote ${destination}\n`);

function row(item: EvalCase, reading: Reading): string {
  const predicted = reading.kind === 'bill' ? 'bill' : 'non-bill';
  const classification = predicted === item.actualType ? 'match' : 'MISS';
  if (reading.kind === 'rejected') {
    return `| ${item.id} | ${item.actualType} | non-bill (${classification}) | n/a | n/a | n/a | n/a | ${item.note} |`;
  }
  const fields = reading.fields;
  return `| ${item.id} | ${item.actualType} | bill (${classification}) | ${mark(fields.merchant.value, item.merchant)} | ${mark(fields.date.value, item.date)} | ${markAmount(fields.amountMinor.value, item.amountMinor)} | ${mark(fields.category.value, item.category)} | ${item.note}${confidenceNote(reading)} |`;
}

function markAmount(actual: number | null, expected: number | null): string {
  if (actual === null && expected === null) return 'missing';
  if (actual === expected && actual !== null) return formatMinor(actual);
  if (actual === null) return 'MISS missing';
  return `MISS ${formatMinor(actual)}`;
}

function mark(actual: string | number | null, expected: string | number | null): string {
  const shown = actual === null ? 'missing' : String(actual);
  return actual === expected ? shown : `MISS ${shown}`;
}

function confidenceNote(reading: Extract<Reading, { kind: 'bill' }>): string {
  const low = (['merchant', 'date', 'amountMinor', 'category'] as const).filter((key) => {
    return reading.fields[key].confidence === 'low';
  });
  return low.length ? `; low confidence: ${low.join(', ')}` : '';
}
