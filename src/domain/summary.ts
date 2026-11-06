export type MonthTotals = {
  incomeMinor: number;
  expenseMinor: number;
  surplusMinor: number;
  savingsMinor: number;
};

/** Surplus is recorded income minus recorded expenses. Savings are not expenses. */
export function recordedSurplus(incomeMinor: number, expenseMinor: number): number {
  return incomeMinor - expenseMinor;
}

export function monthTotals(input: {
  incomeMinor: number;
  expenseMinor: number;
  savingsMinor: number;
}): MonthTotals {
  return {
    incomeMinor: input.incomeMinor,
    expenseMinor: input.expenseMinor,
    surplusMinor: recordedSurplus(input.incomeMinor, input.expenseMinor),
    savingsMinor: input.savingsMinor,
  };
}

export function sumMinor(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
