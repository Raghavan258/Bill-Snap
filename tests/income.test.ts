import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { recordedSurplus } from '../src/domain/summary';
import { isInMonth, splitIncome } from '../src/domain/incomeMonth';
import { savedExpenseFields } from '../src/domain/reviewSave';

describe('income month filtering', () => {
  const salary = {
    amountMinor: 3_500_000,
    frequency: 'monthly',
    startDate: '2026-01-01',
    endDate: null,
  };

  it('counts one-time income only inside the local month', () => {
    const received = [
      { receivedOn: '2026-11-04', amountMinor: 50000 },
      { receivedOn: '2026-11-04T18:30:00.000Z', amountMinor: 25000 },
      { receivedOn: '2026-10-31', amountMinor: 99999 },
    ];
    const split = splitIncome(received, [], 2026, 10);
    assert.equal(split.receivedMinor, 75000);
    assert.equal(isInMonth('2026-11-04T00:00:00', 2026, 10), true);
    assert.equal(isInMonth('2026-12-01', 2026, 10), false);
  });

  it('keeps recorded recurring income and ignores an unpaid schedule', () => {
    const split = splitIncome(
      [{ receivedOn: '2026-11-01', amountMinor: 3_500_000 }],
      [salary],
      2026,
      10,
    );
    assert.equal(split.receivedMinor, 3_500_000);
    assert.equal(split.scheduledMinor, 3_500_000);
    assert.equal(recordedSurplus(split.receivedMinor, 20000), 3_480_000);
    assert.notEqual(recordedSurplus(split.receivedMinor, 20000), recordedSurplus(split.receivedMinor + split.scheduledMinor, 20000));
  });

  it('does not turn an unpaid schedule into received income', () => {
    const split = splitIncome([], [salary], 2026, 10);
    assert.equal(split.receivedMinor, 0);
    assert.equal(split.scheduledMinor, salary.amountMinor);
    assert.equal(recordedSurplus(split.receivedMinor, 10000), -10000);
  });

  it('shows a yearly schedule only in its start month', () => {
    const yearly = { amountMinor: 10000, frequency: 'yearly', startDate: '2026-01-15', endDate: null };
    assert.equal(splitIncome([], [yearly], 2026, 0).scheduledMinor, 10000);
    assert.equal(splitIncome([], [yearly], 2026, 10).scheduledMinor, 0);
  });
});

describe('reviewed expense save', () => {
  it('persists corrected fields instead of the original reading', () => {
    const saved = savedExpenseFields({
      merchant: 'Corrected Cafe',
      date: '2026-11-08',
      amountMinor: 25000,
      category: 'Food',
      notes: '  lunch  ',
    });
    assert.deepEqual(saved, {
      name: 'Corrected Cafe',
      merchant: 'Corrected Cafe',
      transactionDate: '2026-11-08',
      amountMinor: 25000,
      category: 'Food',
      notes: 'lunch',
    });
  });
});
