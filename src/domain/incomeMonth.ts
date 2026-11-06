import { monthRange } from './dates';

export type ReceivedIncome = {
  receivedOn: string;
  amountMinor: number;
};

export type ScheduledIncome = {
  amountMinor: number;
  frequency: string;
  startDate: string;
  endDate: string | null;
};

/** Keeps the calendar date from an ISO date or an ISO datetime. */
export function calendarDate(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  return match?.[1] ?? '';
}

/** True when the calendar date falls in the local month. */
export function isInMonth(value: string, year: number, monthIndex: number): boolean {
  const date = calendarDate(value);
  if (!date) return false;
  const range = monthRange(year, monthIndex);
  return date >= range.start && date <= range.end;
}

/** Sums income that was recorded as received in the month. */
export function sumReceivedInMonth(rows: ReceivedIncome[], year: number, monthIndex: number): number {
  return rows.reduce((total, row) => (
    isInMonth(row.receivedOn, year, monthIndex) ? total + row.amountMinor : total
  ), 0);
}

/**
 * Face amount of a schedule that covers the month.
 * This is not received income and is not multiplied into extra occurrences.
 */
export function scheduledAmountInMonth(schedule: ScheduledIncome, year: number, monthIndex: number): number {
  if (!scheduleCovers(schedule, year, monthIndex)) return 0;
  return schedule.amountMinor;
}

/** Received total only. Scheduled amounts are returned separately and must not be added. */
export function splitIncome(
  received: ReceivedIncome[],
  schedules: ScheduledIncome[],
  year: number,
  monthIndex: number,
): { receivedMinor: number; scheduledMinor: number } {
  const receivedMinor = sumReceivedInMonth(received, year, monthIndex);
  const scheduledMinor = schedules.reduce(
    (total, schedule) => total + scheduledAmountInMonth(schedule, year, monthIndex),
    0,
  );
  return { receivedMinor, scheduledMinor };
}

function scheduleCovers(schedule: ScheduledIncome, year: number, monthIndex: number): boolean {
  const range = monthRange(year, monthIndex);
  const start = calendarDate(schedule.startDate);
  const end = schedule.endDate ? calendarDate(schedule.endDate) : '';
  if (!start || start > range.end) return false;
  if (end && end < range.start) return false;
  if (schedule.frequency === 'yearly') return start.slice(5, 7) === range.start.slice(5, 7);
  return schedule.frequency === 'monthly' || schedule.frequency === 'weekly';
}
