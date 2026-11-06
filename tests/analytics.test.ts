import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  dailyExpenseBars,
  hasAmount,
  hasMonthActivity,
  labelMonthSeries,
  recordedTotal,
  spendingByCategory,
  sumBars,
  topCategories,
  trailingMonths,
  weeklyExpenseBars,
} from '../src/domain/analytics';
import { budgetStatus } from '../src/domain/budgets';

const NOVEMBER = { year: 2026, monthIndex: 10 };

describe('analytics', () => {
  const records = [
    { category: 'Food', amountMinor: 18000, date: '2026-11-03' },
    { category: 'Groceries', amountMinor: 41800, date: '2026-11-10' },
    { category: 'Food', amountMinor: 5000, date: '2026-11-29' },
    { category: 'Utilities', amountMinor: 9000, date: null },
  ];

  it('reconciles category totals with the records and ignores nothing extra', () => {
    const categories = spendingByCategory(records);
    assert.equal(sumBars(categories), recordedTotal(records));
    assert.deepEqual(categories.map((item) => item.category), ['Groceries', 'Food', 'Utilities']);
    assert.equal(categories[1]?.minor, 23000);
    assert.equal(topCategories(records, 1)[0]?.category, 'Groceries');
  });

  it('puts dated spending in the right week and day, and leaves undated rows out', () => {
    const weeks = weeklyExpenseBars(NOVEMBER.year, NOVEMBER.monthIndex, records);
    const days = dailyExpenseBars(NOVEMBER.year, NOVEMBER.monthIndex, records);
    assert.equal(sumBars(weeks), 18000 + 41800 + 5000);
    assert.equal(sumBars(days), sumBars(weeks));
    assert.equal(weeks[0]?.minor, 18000);
    assert.equal(weeks[1]?.minor, 41800);
    assert.equal(weeks[4]?.minor, 5000);
    assert.equal(days[2]?.minor, 18000);
    assert.equal(days.length, 30);
    assert.equal(hasAmount([]), false);
  });

  it('does not invent bars for an empty month', () => {
    const weeks = weeklyExpenseBars(2026, 0, []);
    assert.equal(hasAmount(weeks), false);
    assert.equal(sumBars(weeks), 0);
    assert.equal(hasMonthActivity([{ incomeMinor: 0, expenseMinor: 0 }]), false);
  });

  it('labels the six months ending on the selection', () => {
    const months = trailingMonths(2026, 0, 6);
    assert.equal(months.length, 6);
    assert.deepEqual(months[0], { year: 2025, monthIndex: 7 });
    assert.deepEqual(months[5], { year: 2026, monthIndex: 0 });
    const labelled = labelMonthSeries(months.map((month) => ({ ...month, incomeMinor: 0, expenseMinor: 100 })));
    assert.equal(labelled[0]?.label, 'Aug 25');
    assert.equal(labelled[5]?.label, 'Jan 26');
    const sameYear = labelMonthSeries([
      { year: 2026, monthIndex: 9, incomeMinor: 1, expenseMinor: 2 },
      { year: 2026, monthIndex: 10, incomeMinor: 3, expenseMinor: 4 },
    ]);
    assert.deepEqual(sameYear.map((month) => month.label), ['Oct', 'Nov']);
  });

  it('keeps a budget limit out of the spent amount', () => {
    const under = budgetStatus(4000, 10000);
    assert.equal(under.remainingMinor, 6000);
    assert.equal(under.overMinor, 0);
    assert.equal(under.ratio, 0.4);
    const over = budgetStatus(12000, 10000);
    assert.equal(over.remainingMinor, 0);
    assert.equal(over.overMinor, 2000);
    assert.equal(budgetStatus(500, null).ratio, null);
    assert.equal(recordedTotal([{ amountMinor: 4000 }]), 4000);
  });
});
