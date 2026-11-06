export type MonthEndEstimate = {
  estimateMinor: number | null;
  basis: 'daily-run-rate' | 'not-enough-data';
};

/**
 * Projects recorded spending across the month.
 * Unpaid schedules are not added, so they are not counted twice.
 */
export function estimateMonthEndExpense(input: {
  spentMinor: number;
  dayOfMonth: number;
  daysInMonth: number;
}): MonthEndEstimate {
  const { spentMinor, dayOfMonth, daysInMonth } = input;
  if (dayOfMonth < 1 || daysInMonth < 1 || dayOfMonth > daysInMonth) {
    return { estimateMinor: null, basis: 'not-enough-data' };
  }
  if (spentMinor <= 0) return { estimateMinor: null, basis: 'not-enough-data' };
  const estimateMinor = Math.round((spentMinor / dayOfMonth) * daysInMonth);
  return { estimateMinor, basis: 'daily-run-rate' };
}
