import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { estimateMonthEndExpense } from '../src/domain/forecast';
import { goalProgress, monthlyTargetTotal } from '../src/domain/savings';
import { monthTotals, recordedSurplus } from '../src/domain/summary';

describe('financial calculations', () => {
  it('treats surplus as income minus expenses', () => {
    assert.equal(recordedSurplus(3500000, 1720000), 1780000);
    const totals = monthTotals({ incomeMinor: 500000, expenseMinor: 125000, savingsMinor: 40000 });
    assert.equal(totals.surplusMinor, 375000);
    assert.equal(totals.savingsMinor, 40000);
  });

  it('does not count a schedule amount as received income', () => {
    const expectedSchedule = 8000000;
    const totals = monthTotals({ incomeMinor: 0, expenseMinor: 20000, savingsMinor: 0 });
    assert.equal(totals.incomeMinor, 0);
    assert.notEqual(totals.incomeMinor, expectedSchedule);
    assert.equal(totals.surplusMinor, -20000);
  });

  it('estimates a month from the spending pace and refuses to invent a figure', () => {
    const pace = estimateMonthEndExpense({ spentMinor: 10000, dayOfMonth: 1, daysInMonth: 30 });
    assert.equal(pace.estimateMinor, 300000);
    assert.equal(pace.basis, 'daily-run-rate');
    const empty = estimateMonthEndExpense({ spentMinor: 0, dayOfMonth: 4, daysInMonth: 30 });
    assert.equal(empty.estimateMinor, null);
  });

  it('measures savings only from recorded contributions', () => {
    assert.equal(goalProgress(5000, 10000).ratio, 0.5);
    assert.equal(goalProgress(15000, 10000).ratio, 1);
    assert.equal(goalProgress(15000, 10000).remainingMinor, 0);
    assert.equal(goalProgress(1000, null).ratio, null);
    assert.equal(goalProgress(1000, 0).ratio, null);
    assert.equal(monthlyTargetTotal(200000, 6), 1200000);
    assert.equal(monthlyTargetTotal(200000, null), null);
  });
});
