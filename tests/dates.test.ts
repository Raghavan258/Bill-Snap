import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { advanceUntilAfter, daysInMonth, monthRange, parseReceiptDate, toIsoDate } from '../src/domain/dates';

describe('dates', () => {
  it('parses Indian and ISO receipt dates', () => {
    assert.equal(parseReceiptDate('Date: 05/11/2026')?.iso, '2026-11-05');
    assert.equal(parseReceiptDate('7 Nov 2026')?.iso, '2026-11-07');
    assert.equal(parseReceiptDate('05-Nov-2026')?.iso, '2026-11-05');
    assert.equal(parseReceiptDate('05 Nov, 2026')?.iso, '2026-11-05');
    assert.equal(parseReceiptDate('2026-09-30')?.iso, '2026-09-30');
    assert.equal(parseReceiptDate('5-11-26')?.iso, '2026-11-05');
    assert.equal(parseReceiptDate('32/13/2026'), null);
  });

  it('marks numeric dates as ambiguous when both parts could be a month', () => {
    assert.equal(parseReceiptDate('05/11/2026')?.ambiguous, true);
    assert.equal(parseReceiptDate('15-10-2026')?.ambiguous, false);
    assert.equal(parseReceiptDate('11/11/2026')?.ambiguous, false);
  });

  it('uses local calendar boundaries', () => {
    assert.equal(daysInMonth(2026, 1), 28);
    assert.equal(daysInMonth(2024, 1), 29);
    assert.deepEqual(monthRange(2026, 11), { start: '2026-12-01', end: '2026-12-31' });
    assert.equal(monthRange(2026, 0).start, '2026-01-01');
    const evening = new Date(2026, 10, 4, 23, 30);
    assert.equal(toIsoDate(evening), '2026-11-04');
  });

  it('advances a due date past today', () => {
    assert.equal(advanceUntilAfter('2026-10-01', 'monthly', '2026-11-04'), '2026-12-01');
    assert.equal(advanceUntilAfter('2026-11-01', 'weekly', '2026-11-04'), '2026-11-08');
  });
});
