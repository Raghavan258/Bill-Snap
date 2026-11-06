import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateManualExpense, validateRecurringIncome, validateReviewedExpense } from '../src/domain/validation';

describe('validation', () => {
  it('requires a name, amount, and category for manual expenses', () => {
    const errors = validateManualExpense({
      name: '',
      amount: '0',
      category: '',
      date: '',
      merchant: '',
      notes: '',
    });
    assert.ok(errors.name);
    assert.ok(errors.amount);
    assert.ok(errors.category);
    assert.equal(errors.date, undefined);
  });

  it('requires a reviewed bill to have merchant, date, amount, and category', () => {
    const errors = validateReviewedExpense({
      merchant: '',
      amount: '',
      category: 'Food',
      date: '',
      notes: '',
    });
    assert.ok(errors.merchant);
    assert.ok(errors.amount);
    assert.ok(errors.date);
  });

  it('keeps a recurring end date from falling before the start', () => {
    const errors = validateRecurringIncome({
      name: 'Salary',
      amount: '50000',
      category: 'Salary',
      frequency: 'monthly',
      startDate: '2026-11-01',
      endDate: '2026-10-01',
      notes: '',
    });
    assert.ok(errors.endDate);
  });
});
