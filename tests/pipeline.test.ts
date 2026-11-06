import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { interpretOcr } from '../src/pipeline/interpretOcr';
import { EVAL_CASES, documentFrom, runCase } from './fixtures';

describe('bill pipeline', () => {
  for (const item of EVAL_CASES) {
    it(item.id, () => {
      const reading = runCase(item);
      if (item.actualType === 'non-bill') {
        assert.equal(reading.kind, 'rejected');
        return;
      }
      assert.equal(reading.kind, 'bill');
      if (reading.kind !== 'bill') return;
      assert.equal(reading.fields.merchant.value, item.merchant);
      assert.equal(reading.fields.date.value, item.date);
      assert.equal(reading.fields.amountMinor.value, item.amountMinor);
      assert.equal(reading.fields.category.value, item.category);
    });
  }

  it('does not treat a priced menu as a bill', () => {
    const reading = interpretOcr(documentFrom(`CAFE MENU
Cappuccino 180.00
Sandwich 220.00
Cake 150.00`));
    assert.equal(reading.kind, 'rejected');
  });

  it('still accepts a receipt photographed inside a chat screenshot', () => {
    const reading = interpretOcr(documentFrom(`WhatsApp
CAFE MOCHA
Total 180.00
Date 05/11/2026`));
    assert.equal(reading.kind, 'bill');
  });

  it('sends a short receipt without the word total to review', () => {
    const reading = interpretOcr(documentFrom(`KIRANA STORE
Rice 80.00
05/11/2026`));
    assert.equal(reading.kind, 'bill');
    if (reading.kind !== 'bill') return;
    assert.equal(reading.classification.decision, 'needs-review');
    assert.equal(reading.fields.merchant.value, 'KIRANA STORE');
    assert.equal(reading.fields.amountMinor.value, 8000);
    assert.equal(reading.fields.amountMinor.confidence, 'high');
  });

  it('does not accept an uncertain upi slip as a confirmed receipt', () => {
    const reading = interpretOcr(documentFrom(`SWIGGY
Paid via UPI
Rs 486`));
    assert.equal(reading.kind, 'bill');
    if (reading.kind !== 'bill') return;
    assert.equal(reading.classification.decision, 'needs-review');
    assert.equal(reading.fields.amountMinor.value, 48600);
  });

  it('flags conflicting totals and ignores a discount labelled as total', () => {
    const reading = interpretOcr(documentFrom(`CAFE
Date 15/11/2026
Total Discount 50.00
Grand Total 450.00`));
    assert.equal(reading.kind, 'bill');
    if (reading.kind !== 'bill') return;
    assert.equal(reading.classification.decision, 'accepted');
    assert.equal(reading.fields.amountMinor.value, 45000);
  });

  it('reads a comma-only total and a month-name date', () => {
    const reading = interpretOcr(documentFrom(`CITY STORE
05-Nov-2026
Total 1,234`));
    assert.equal(reading.kind, 'bill');
    if (reading.kind !== 'bill') return;
    assert.equal(reading.fields.date.value, '2026-11-05');
    assert.equal(reading.fields.amountMinor.value, 123400);
  });

  it('flags two different dates instead of choosing today', () => {
    const reading = interpretOcr(documentFrom(`SHOP
15/11/2026
20/11/2026
Total 100.00`));
    assert.equal(reading.kind, 'bill');
    if (reading.kind !== 'bill') return;
    assert.equal(reading.fields.date.confidence, 'low');
    assert.notEqual(reading.fields.date.value, null);
  });

  it('does not invent an amount when none can be read', () => {
    const reading = runCase(EVAL_CASES.find((item) => item.id === 'bill-15-missing-amount')!);
    assert.equal(reading.kind, 'bill');
    if (reading.kind === 'bill') assert.equal(reading.fields.amountMinor.value, null);
  });
});
