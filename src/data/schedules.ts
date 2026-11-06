import { advanceUntilAfter } from '../domain/dates';
import { getDb } from './db';
import { insertExpense } from './expenses';
import { activeUserId, requireUserId } from './scope';
import type { ExpenseScheduleRow } from './types';

export async function insertExpenseSchedule(input: {
  id: string;
  name: string;
  category: string;
  amountMinor: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextDue: string;
  notes: string | null;
  createdAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO expense_schedules
      (id, name, category, amount_minor, frequency, next_due, notes, created_at, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.name,
    input.category,
    input.amountMinor,
    input.frequency,
    input.nextDue,
    input.notes,
    input.createdAt,
    requireUserId(),
  );
}

export async function listExpenseSchedules(): Promise<ExpenseScheduleRow[]> {
  const userId = activeUserId();
  if (!userId) return [];
  const db = await getDb();
  return db.getAllAsync<ExpenseScheduleRow>(
    'SELECT * FROM expense_schedules WHERE user_id = ? ORDER BY next_due ASC',
    userId,
  );
}

export async function sumUnpaidCommitments(start: string, end: string): Promise<number> {
  const userId = activeUserId();
  if (!userId) return 0;
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(amount_minor), 0) AS total FROM expense_schedules
     WHERE user_id = ? AND next_due >= ? AND next_due <= ?`,
    userId,
    start,
    end,
  );
  return row?.total ?? 0;
}

/** Records one real expense, then moves the schedule forward. The schedule itself is not spent money. */
export async function markSchedulePaid(input: {
  schedule: ExpenseScheduleRow;
  expenseId: string;
  paidOn: string;
  createdAt: string;
}): Promise<void> {
  const frequency = input.schedule.frequency;
  if (frequency !== 'weekly' && frequency !== 'monthly' && frequency !== 'yearly') throw new Error('schedule');
  const nextDue = advanceUntilAfter(input.schedule.next_due, frequency, input.paidOn);
  if (!nextDue) throw new Error('schedule');
  const userId = requireUserId();
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await insertExpense({
      id: input.expenseId,
      name: input.schedule.name,
      merchant: input.schedule.name,
      transactionDate: input.paidOn,
      amountMinor: input.schedule.amount_minor,
      category: input.schedule.category,
      imageUri: null,
      notes: 'Recorded from a recurring commitment',
      source: 'recurring',
      createdAt: input.createdAt,
    });
    await db.runAsync(
      'UPDATE expense_schedules SET next_due = ? WHERE id = ? AND user_id = ?',
      nextDue,
      input.schedule.id,
      userId,
    );
  });
}
