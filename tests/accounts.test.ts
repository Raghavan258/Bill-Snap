import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyFinancialReset,
  deleteIncomeSchedule,
  deleteReceivedIncome,
  expensesForUser,
  incomeForUser,
  openBooks,
  receivedMinor,
  registerAccount,
  type Books,
} from '../src/domain/accounts';
import { validateRegistration } from '../src/domain/auth';
import { expenseDonut } from '../src/domain/donut';
import { filterLedger, type LedgerEntry } from '../src/domain/ledger';
import { FINANCIAL_RESET_VERSION, shouldWipeFinancialData } from '../src/domain/reset';
import { monthTotals } from '../src/domain/summary';

const salary = { id: 'in-1', userId: 'ada', name: 'Salary', amountMinor: 5000000, receivedOn: '2026-11-01', scheduleId: 'sch-1' };
const gift = { id: 'in-2', userId: 'ada', name: 'Gift', amountMinor: 200000, receivedOn: '2026-11-03', scheduleId: null };
const otherUser = { id: 'in-3', userId: 'ben', name: 'Bonus', amountMinor: 900000, receivedOn: '2026-11-02', scheduleId: null };

function sampleBooks(): Books {
  return {
    version: 2,
    users: [{ id: 'ada', fullName: 'Ada Lovelace', mobile: '9876543210' }],
    sessionUserId: 'ada',
    income: [salary, gift, otherUser],
    schedules: [{ id: 'sch-1', userId: 'ada', name: 'Salary', amountMinor: 5000000 }],
    expenses: [{ id: 'ex-1', userId: 'ada', name: 'Groceries', merchant: 'Market', category: 'Groceries', amountMinor: 125000, date: '2026-11-04' }],
  };
}

describe('one-time financial reset', () => {
  it('clears old records once and leaves accounts in place', () => {
    const first = applyFinancialReset(sampleBooks());
    assert.equal(first.wiped, true);
    assert.equal(first.books.version, FINANCIAL_RESET_VERSION);
    assert.equal(first.books.income.length, 0);
    assert.equal(first.books.schedules.length, 0);
    assert.equal(first.books.expenses.length, 0);
    assert.equal(first.books.users.length, 1);
    assert.equal(first.books.sessionUserId, 'ada');

    const added = { ...first.books, income: [gift] };
    const second = applyFinancialReset(added);
    assert.equal(second.wiped, false);
    assert.equal(second.books.income.length, 1);
    assert.equal(shouldWipeFinancialData(null), false);
    assert.equal(shouldWipeFinancialData(FINANCIAL_RESET_VERSION), false);
  });

  it('still accepts a new registration after the reset', () => {
    const reset = applyFinancialReset({ ...sampleBooks(), users: [], sessionUserId: null }).books;
    const errors = validateRegistration({
      fullName: 'Grace Hopper',
      mobile: '9123456789',
      password: 'secret1',
      confirmPassword: 'secret1',
    });
    assert.equal(Object.keys(errors).length, 0);
    const registered = registerAccount(reset, { id: 'grace', fullName: 'Grace Hopper', mobile: '9123456789' });
    assert.equal(registered.users.length, 1);
    assert.equal(registered.sessionUserId, 'grace');
  });
});

describe('income changes', () => {
  it('deletes one received payment and recalculates the month', () => {
    const before = monthTotals({
      incomeMinor: receivedMinor(incomeForUser(sampleBooks(), 'ada')),
      expenseMinor: 125000,
      savingsMinor: 0,
    });
    const next = deleteReceivedIncome(sampleBooks(), 'ada', 'in-2');
    const ada = incomeForUser(next, 'ada');
    assert.deepEqual(ada.map((row) => row.id), ['in-1']);
    assert.equal(incomeForUser(next, 'ben').length, 1);
    const after = monthTotals({ incomeMinor: receivedMinor(ada), expenseMinor: 125000, savingsMinor: 0 });
    assert.equal(after.incomeMinor, before.incomeMinor - gift.amountMinor);
    assert.equal(after.surplusMinor, before.surplusMinor - gift.amountMinor);
    assert.equal(after.expenseMinor, before.expenseMinor);
    assert.equal(after.savingsMinor, 0);
  });

  it('keeps received history when a schedule is deleted', () => {
    const next = deleteIncomeSchedule(sampleBooks(), 'ada', 'sch-1');
    assert.equal(next.schedules.length, 0);
    assert.equal(next.income.length, 3);
    const received = receivedMinor(incomeForUser(next, 'ada'));
    assert.equal(received, salary.amountMinor + gift.amountMinor);
    assert.equal(receivedMinor(next.schedules), 0);
  });

  it('does not let one user read another user\'s expenses', () => {
    assert.equal(expensesForUser(sampleBooks(), 'ben').length, 0);
    assert.equal(expensesForUser(sampleBooks(), 'ada')[0]?.id, 'ex-1');
  });
});

describe('transaction history', () => {
  const entries: LedgerEntry[] = [
    { id: 'in-1', kind: 'income', name: 'Salary', merchant: null, category: 'Salary', date: '2026-11-01', amountMinor: 5000000 },
    { id: 'ex-1', kind: 'expense', name: 'Milk', merchant: 'Market', category: 'Groceries', date: '2026-11-04', amountMinor: 8000 },
    { id: 'in-2', kind: 'income', name: 'Gift', merchant: null, category: 'Gift', date: '2026-11-03', amountMinor: 200000 },
  ];

  it('filters by type, category, and search, then drops a deleted row', () => {
    const expenses = filterLedger(entries, { text: 'market', kind: 'expense', category: 'Groceries', from: '2026-11-01', to: '2026-11-30' });
    assert.deepEqual(expenses.map((entry) => entry.id), ['ex-1']);
    const refreshed = filterLedger(entries.filter((entry) => entry.id !== 'in-2'), { text: '', kind: 'income', category: '', from: '', to: '' });
    assert.deepEqual(refreshed.map((entry) => entry.id), ['in-1']);
  });
});

describe('expense donut', () => {
  it('uses only expense amounts and puts a blank category in Others', () => {
    const slices = expenseDonut([
      { category: 'Food', amountMinor: 10000 },
      { category: ' ', amountMinor: 5000 },
      { category: 'Food', amountMinor: 5000 },
    ]);
    assert.equal(slices.reduce((sum, slice) => sum + slice.minor, 0), 20000);
    assert.equal(slices.find((slice) => slice.category === 'Food')?.minor, 15000);
    assert.equal(slices.find((slice) => slice.category === 'Others')?.minor, 5000);
    assert.equal(slices.reduce((sum, slice) => sum + slice.percent, 0), 100);
  });
});

describe('restart', () => {
  it('reads the same user records that were saved', () => {
    const saved = deleteReceivedIncome(sampleBooks(), 'ada', 'in-2');
    const reopened = openBooks(saved);
    assert.equal(reopened.sessionUserId, 'ada');
    assert.deepEqual(incomeForUser(reopened, 'ada').map((row) => row.id), ['in-1']);
    assert.equal(reopened.schedules.length, 1);
  });
});
