import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { coerceMinor, formatMinor, parseAmountToMinor, parseUserAmount } from '../src/domain/money';

describe('money', () => {
  it('formats paise with Indian grouping', () => {
    assert.equal(formatMinor(12345670), '₹1,23,456.70');
    assert.equal(formatMinor(18000), '₹180.00');
    assert.equal(formatMinor(0), '₹0.00');
    assert.equal(formatMinor(-100), '-₹1.00');
  });

  it('parses rupee strings into paise without floating point', () => {
    assert.equal(parseAmountToMinor('1,200.50'), 120050);
    assert.equal(parseAmountToMinor('₹486.00'), 48600);
    assert.equal(parseAmountToMinor('Rs. 250'), 25000);
    assert.equal(parseAmountToMinor('0'), null);
    assert.equal(parseAmountToMinor(''), null);
    assert.equal(parseAmountToMinor('12.345'), null);
  });

  it('coerces database totals that arrive as strings', () => {
    assert.equal(coerceMinor('50000'), 50000);
    assert.equal(coerceMinor(1250.9), 1250);
    assert.equal(coerceMinor(null), 0);
    assert.equal(coerceMinor(undefined), 0);
  });

  it('rejects empty user input instead of inventing zero', () => {
    assert.equal(parseUserAmount(''), null);
    assert.equal(parseUserAmount('0.00'), null);
    assert.equal(parseUserAmount('12.5'), 1250);
  });
});
