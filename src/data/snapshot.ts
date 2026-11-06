import { daysInMonth, monthRange } from '../domain/dates';
import type { MonthEndEstimate } from '../domain/forecast';
import { estimateMonthEndExpense } from '../domain/forecast';
import { monthTotals, type MonthTotals } from '../domain/summary';
import { sumExpensesBetween } from './expenses';
import { scheduledAmountInMonth } from '../domain/incomeMonth';
import { sumIncomeBetween, listIncomeSchedules } from './income';
import { sumContributionsBetween } from './savings';
import { sumUnpaidCommitments } from './schedules';
import type { ExpenseRow, IncomeRow } from './types';
import { expensesBetween } from './expenses';
import { incomeBetween } from './income';

export type MonthSnapshot = {
  year: number;
  monthIndex: number;
  totals: MonthTotals;
  estimate: MonthEndEstimate | null;
  isCurrent: boolean;
  unpaidCommitmentsMinor: number;
  expectedIncomeMinor: number;
  expenses: ExpenseRow[];
  income: IncomeRow[];
};

/** Loads recorded figures for a calendar month. Schedules are not treated as received or paid. */
export async function loadMonthSnapshot(year: number, monthIndex: number, today: Date): Promise<MonthSnapshot> {
  const range = monthRange(year, monthIndex);
  const [expenseMinor, incomeMinor, savingsMinor, unpaid, expenses, income, schedules] = await Promise.all([
    sumExpensesBetween(range.start, range.end),
    sumIncomeBetween(range.start, range.end),
    sumContributionsBetween(range.start, range.end),
    sumUnpaidCommitments(range.start, range.end),
    expensesBetween(range.start, range.end),
    incomeBetween(range.start, range.end),
    listIncomeSchedules(),
  ]);
  const isCurrent = year === today.getFullYear() && monthIndex === today.getMonth();
  return {
    year,
    monthIndex,
    totals: monthTotals({ incomeMinor, expenseMinor, savingsMinor }),
    estimate: isCurrent
      ? estimateMonthEndExpense({
          spentMinor: expenseMinor,
          dayOfMonth: today.getDate(),
          daysInMonth: daysInMonth(year, monthIndex),
        })
      : null,
    isCurrent,
    unpaidCommitmentsMinor: unpaid,
    expectedIncomeMinor: expectedIncome(schedules, year, monthIndex),
    expenses,
    income,
  };
}

function expectedIncome(
  schedules: Awaited<ReturnType<typeof listIncomeSchedules>>,
  year: number,
  monthIndex: number,
): number {
  return schedules.reduce((total, schedule) => total + scheduledAmountInMonth({
    amountMinor: schedule.amount_minor,
    frequency: schedule.frequency,
    startDate: schedule.start_date,
    endDate: schedule.end_date,
  }, year, monthIndex), 0);
}
