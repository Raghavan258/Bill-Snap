import { getDb } from './db';
import { activeUserId, requireUserId } from './scope';

export type BudgetRow = {
  category: string;
  limitMinor: number;
};

/** Lists monthly category limits for the signed-in user. These rows are not transactions. */
export async function listBudgets(): Promise<BudgetRow[]> {
  const userId = activeUserId();
  if (!userId) return [];
  const db = await getDb();
  const rows = await db.getAllAsync<{ category: string; limit_minor: number }>(
    'SELECT category, limit_minor FROM category_budgets WHERE user_id = ? ORDER BY category',
    userId,
  );
  return rows.map((row) => ({ category: row.category, limitMinor: row.limit_minor }));
}

/** Stores a monthly spending limit for one existing expense category. */
export async function saveBudget(category: string, limitMinor: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO category_budgets (user_id, category, limit_minor) VALUES (?, ?, ?)
     ON CONFLICT(user_id, category) DO UPDATE SET limit_minor = excluded.limit_minor`,
    requireUserId(),
    category,
    limitMinor,
  );
}

/** Removes a category limit without changing expenses. */
export async function clearBudget(category: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM category_budgets WHERE user_id = ? AND category = ?', requireUserId(), category);
}
