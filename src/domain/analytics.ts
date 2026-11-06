import { daysInMonth } from './dates';
import { shiftMonth } from './display';

export const OVERVIEW_MONTH_COUNT = 6;
export const HOME_CATEGORY_LIMIT = 3;
const WEEK_LENGTH = 7;
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export type DatedAmount = {
  amountMinor: number;
  date: string | null;
  category?: string;
};

export type NamedAmount = {
  label: string;
  minor: number;
};

export type CategoryAmount = {
  category: string;
  minor: number;
  share: number;
};

export type MonthAmount = {
  year: number;
  monthIndex: number;
  incomeMinor: number;
  expenseMinor: number;
};

export type LabelledMonth = MonthAmount & { label: string };

/** Sums recorded transaction amounts. Callers must not include unpaid schedules. */
export function recordedTotal(records: { amountMinor: number }[]): number {
  return records.reduce((total, record) => total + record.amountMinor, 0);
}

/** Sums chart bars. A bar of zero is a day or week with no recorded amount. */
export function sumBars(values: { minor: number }[]): number {
  return values.reduce((total, value) => total + value.minor, 0);
}

/** Groups recorded spending by category. Shares use only those records. */
export function spendingByCategory(records: { category: string; amountMinor: number }[]): CategoryAmount[] {
  const totals = new Map<string, number>();
  for (const record of records) {
    totals.set(record.category, (totals.get(record.category) ?? 0) + record.amountMinor);
  }
  return toShares([...totals.entries()]);
}

/** Returns the largest category totals, already sorted. */
export function topCategories(
  records: { category: string; amountMinor: number }[],
  limit: number,
): CategoryAmount[] {
  return spendingByCategory(records).slice(0, Math.max(limit, 0));
}

/** Sums dated expenses into calendar weeks of the selected month. Undated rows are omitted. */
export function weeklyExpenseBars(year: number, monthIndex: number, records: DatedAmount[]): NamedAmount[] {
  return weekRanges(daysInMonth(year, monthIndex)).map((range) => ({
    label: range.label,
    minor: sumInDays(records, year, monthIndex, range.start, range.end),
  }));
}

/** One bar per day of the month. Days with no dated expense are zero, not guessed. */
export function dailyExpenseBars(year: number, monthIndex: number, records: DatedAmount[]): NamedAmount[] {
  const last = daysInMonth(year, monthIndex);
  return Array.from({ length: last }, (_, index) => {
    const day = index + 1;
    return { label: String(day), minor: sumInDays(records, year, monthIndex, day, day) };
  });
}

/** True when at least one bar has a recorded amount. */
export function hasAmount(values: { minor: number }[]): boolean {
  return values.some((value) => value.minor > 0);
}

/** True when any month in the series has recorded income or expenses. */
export function hasMonthActivity(months: { incomeMinor: number; expenseMinor: number }[]): boolean {
  return months.some((month) => month.incomeMinor > 0 || month.expenseMinor > 0);
}

/** Calendar months ending at the selected month, oldest first. */
export function trailingMonths(
  year: number,
  monthIndex: number,
  count: number,
): { year: number; monthIndex: number }[] {
  const months = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    months.push(shiftMonth(year, monthIndex, -offset));
  }
  return months;
}

/** Adds short axis labels. A year suffix appears only when the series crosses a year. */
export function labelMonthSeries(months: MonthAmount[]): LabelledMonth[] {
  const spansYears = new Set(months.map((month) => month.year)).size > 1;
  return months.map((month) => ({ ...month, label: monthLabel(month, spansYears) }));
}

function toShares(entries: [string, number][]): CategoryAmount[] {
  const total = entries.reduce((sum, [, minor]) => sum + minor, 0);
  return entries
    .map(([category, minor]) => ({ category, minor, share: total === 0 ? 0 : minor / total }))
    .sort(byMinorThenName);
}

function byMinorThenName(left: CategoryAmount, right: CategoryAmount): number {
  return right.minor - left.minor || left.category.localeCompare(right.category);
}

function monthLabel(month: MonthAmount, spansYears: boolean): string {
  const name = SHORT_MONTHS[month.monthIndex] ?? '';
  if (!spansYears) return name;
  return `${name} ${String(month.year).slice(2)}`;
}

function weekRanges(days: number): { label: string; start: number; end: number }[] {
  const ranges = [];
  for (let start = 1; start <= days; start += WEEK_LENGTH) {
    const end = Math.min(start + WEEK_LENGTH - 1, days);
    ranges.push({ label: start === end ? String(start) : `${start}–${end}`, start, end });
  }
  return ranges;
}

function sumInDays(
  records: DatedAmount[],
  year: number,
  monthIndex: number,
  start: number,
  end: number,
): number {
  return records.reduce((total, record) => {
    const day = dayInMonth(record.date, year, monthIndex);
    if (day === null || day < start || day > end) return total;
    return total + record.amountMinor;
  }, 0);
}

function dayInMonth(iso: string | null, year: number, monthIndex: number): number | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  if (Number(match[1]) !== year || Number(match[2]) !== monthIndex + 1) return null;
  const day = Number(match[3]);
  const last = daysInMonth(year, monthIndex);
  if (day < 1 || day > last) return null;
  return day;
}
