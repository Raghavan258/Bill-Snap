import {
  labelMonthSeries,
  OVERVIEW_MONTH_COUNT,
  trailingMonths,
  type LabelledMonth,
} from '../domain/analytics';
import { monthRange } from '../domain/dates';
import { listBudgets, type BudgetRow } from './budgets';
import { sumExpensesBetween } from './expenses';
import { sumIncomeBetween } from './income';
import { listGoals } from './savings';
import type { GoalRow } from './types';

export type OverviewExtras = {
  series: LabelledMonth[];
  goals: GoalRow[];
  budgets: BudgetRow[];
};

/** Loads chart inputs from recorded rows. Schedules are not queried. */
export async function loadOverviewExtras(year: number, monthIndex: number): Promise<OverviewExtras> {
  const [series, goals, budgets] = await Promise.all([
    loadMonthSeries(year, monthIndex),
    listGoals(),
    listBudgets(),
  ]);
  return { series, goals, budgets };
}

async function loadMonthSeries(year: number, monthIndex: number): Promise<LabelledMonth[]> {
  const months = trailingMonths(year, monthIndex, OVERVIEW_MONTH_COUNT);
  const points = [];
  for (const month of months) {
    points.push(await recordedMonth(month.year, month.monthIndex));
  }
  return labelMonthSeries(points);
}

async function recordedMonth(year: number, monthIndex: number) {
  const range = monthRange(year, monthIndex);
  const [incomeMinor, expenseMinor] = await Promise.all([
    sumIncomeBetween(range.start, range.end),
    sumExpensesBetween(range.start, range.end),
  ]);
  return { year, monthIndex, incomeMinor, expenseMinor };
}
