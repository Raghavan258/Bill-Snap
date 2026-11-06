import { coerceMinor } from '../domain/money';
import { getDb } from './db';
import { bumpData } from './revision';
import { activeUserId, requireUserId } from './scope';
import type { ExpenseRow, NewExpense } from './types';

const COLUMNS = 'id, name, merchant, transaction_date, amount_minor, category, image_uri, notes, source, created_at, user_id';

export async function insertExpense(input: NewExpense): Promise<void> {
  const db = await getDb();
  const userId = requireUserId();
  await db.runAsync(
    `INSERT INTO expenses (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.name,
    input.merchant,
    input.transactionDate,
    input.amountMinor,
    input.category,
    input.imageUri,
    input.notes,
    input.source,
    input.createdAt,
    userId,
  );
  bumpData();
}

/** Updates one expense owned by the signed-in user. */
export async function updateExpense(input: {
  id: string;
  name: string;
  merchant: string | null;
  transactionDate: string | null;
  amountMinor: number;
  category: string;
  notes: string | null;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE expenses
     SET name = ?, merchant = ?, transaction_date = ?, amount_minor = ?, category = ?, notes = ?
     WHERE id = ? AND user_id = ?`,
    input.name,
    input.merchant,
    input.transactionDate,
    input.amountMinor,
    input.category,
    input.notes,
    input.id,
    requireUserId(),
  );
  bumpData();
}

export async function listExpenses(): Promise<ExpenseRow[]> {
  const userId = activeUserId();
  if (!userId) return [];
  const db = await getDb();
  return db.getAllAsync<ExpenseRow>(
    `SELECT ${COLUMNS} FROM expenses WHERE user_id = ? ORDER BY created_at DESC`,
    userId,
  );
}

export async function expensesBetween(start: string, end: string): Promise<ExpenseRow[]> {
  const userId = activeUserId();
  if (!userId) return [];
  const db = await getDb();
  return db.getAllAsync<ExpenseRow>(
    `SELECT ${COLUMNS} FROM expenses
     WHERE user_id = ? AND transaction_date >= ? AND transaction_date <= ?
     ORDER BY transaction_date DESC, created_at DESC`,
    userId,
    start,
    end,
  );
}

export async function getExpense(id: string): Promise<ExpenseRow | null> {
  const userId = activeUserId();
  if (!userId) return null;
  const db = await getDb();
  return db.getFirstAsync<ExpenseRow>(`SELECT ${COLUMNS} FROM expenses WHERE id = ? AND user_id = ?`, id, userId);
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM expenses WHERE id = ? AND user_id = ?', id, requireUserId());
  bumpData();
}

export async function sumExpensesBetween(start: string, end: string): Promise<number> {
  const userId = activeUserId();
  if (!userId) return 0;
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(amount_minor), 0) AS total FROM expenses
     WHERE user_id = ? AND transaction_date >= ? AND transaction_date <= ?`,
    userId,
    start,
    end,
  );
  return coerceMinor(row?.total);
}
