import { calendarDate } from '../domain/incomeMonth';
import { coerceMinor } from '../domain/money';
import { getDb } from './db';
import { bumpData } from './revision';
import { activeUserId, requireUserId } from './scope';
import type { IncomeRow, IncomeScheduleRow } from './types';

export async function insertIncome(input: {
  id: string;
  name: string;
  category: string;
  amountMinor: number;
  receivedOn: string;
  notes: string | null;
  scheduleId: string | null;
  createdAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO income_received
      (id, name, category, amount_minor, received_on, notes, schedule_id, created_at, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.name,
    input.category,
    input.amountMinor,
    calendarDate(input.receivedOn),
    input.notes,
    input.scheduleId,
    input.createdAt,
    requireUserId(),
  );
  bumpData();
}

/** Updates one received income row. Other rows, including its schedule, stay as they are. */
export async function updateIncome(input: {
  id: string;
  name: string;
  category: string;
  amountMinor: number;
  receivedOn: string;
  notes: string | null;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE income_received
     SET name = ?, category = ?, amount_minor = ?, received_on = ?, notes = ?
     WHERE id = ? AND user_id = ?`,
    input.name,
    input.category,
    input.amountMinor,
    calendarDate(input.receivedOn),
    input.notes,
    input.id,
    requireUserId(),
  );
  bumpData();
}

/** Deletes one received income row by id. It does not delete a schedule or any other payment. */
export async function deleteIncome(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM income_received WHERE id = ? AND user_id = ?', id, requireUserId());
  bumpData();
}

export async function getIncome(id: string): Promise<IncomeRow | null> {
  const userId = activeUserId();
  if (!userId) return null;
  const db = await getDb();
  return db.getFirstAsync<IncomeRow>('SELECT * FROM income_received WHERE id = ? AND user_id = ?', id, userId);
}

export async function listIncome(): Promise<IncomeRow[]> {
  const userId = activeUserId();
  if (!userId) return [];
  const db = await getDb();
  return db.getAllAsync<IncomeRow>(
    'SELECT * FROM income_received WHERE user_id = ? ORDER BY received_on DESC, created_at DESC',
    userId,
  );
}

export async function insertIncomeSchedule(input: {
  id: string;
  name: string;
  category: string;
  amountMinor: number;
  frequency: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO income_schedules
      (id, name, category, amount_minor, frequency, start_date, end_date, notes, created_at, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.name,
    input.category,
    input.amountMinor,
    input.frequency,
    input.startDate,
    input.endDate,
    input.notes,
    input.createdAt,
    requireUserId(),
  );
  bumpData();
}

/** Updates a recurring income schedule. Already received payments are not changed. */
export async function updateIncomeSchedule(input: {
  id: string;
  name: string;
  category: string;
  amountMinor: number;
  frequency: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE income_schedules
     SET name = ?, category = ?, amount_minor = ?, frequency = ?, start_date = ?, end_date = ?, notes = ?
     WHERE id = ? AND user_id = ?`,
    input.name,
    input.category,
    input.amountMinor,
    input.frequency,
    input.startDate,
    input.endDate,
    input.notes,
    input.id,
    requireUserId(),
  );
  bumpData();
}

/**
 * Deletes the schedule only.
 * income_received rows keep their schedule_id and remain in history and totals.
 */
export async function deleteIncomeSchedule(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM income_schedules WHERE id = ? AND user_id = ?', id, requireUserId());
  bumpData();
}

export async function getIncomeSchedule(id: string): Promise<IncomeScheduleRow | null> {
  const userId = activeUserId();
  if (!userId) return null;
  const db = await getDb();
  return db.getFirstAsync<IncomeScheduleRow>('SELECT * FROM income_schedules WHERE id = ? AND user_id = ?', id, userId);
}

export async function listIncomeSchedules(): Promise<IncomeScheduleRow[]> {
  const userId = activeUserId();
  if (!userId) return [];
  const db = await getDb();
  return db.getAllAsync<IncomeScheduleRow>(
    'SELECT * FROM income_schedules WHERE user_id = ? ORDER BY created_at DESC',
    userId,
  );
}

export async function incomeBetween(start: string, end: string): Promise<IncomeRow[]> {
  const userId = activeUserId();
  if (!userId) return [];
  const db = await getDb();
  return db.getAllAsync<IncomeRow>(
    `SELECT * FROM income_received
     WHERE user_id = ? AND substr(received_on, 1, 10) >= ? AND substr(received_on, 1, 10) <= ?
     ORDER BY received_on DESC, created_at DESC`,
    userId,
    start,
    end,
  );
}

export async function sumIncomeBetween(start: string, end: string): Promise<number> {
  const userId = activeUserId();
  if (!userId) return 0;
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(amount_minor), 0) AS total FROM income_received
     WHERE user_id = ? AND substr(received_on, 1, 10) >= ? AND substr(received_on, 1, 10) <= ?`,
    userId,
    start,
    end,
  );
  return coerceMinor(row?.total);
}
