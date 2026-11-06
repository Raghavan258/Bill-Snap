import { getDb } from './db';
import { activeUserId } from './scope';

export type RecordCounts = {
  expenses: number;
  income: number;
  goals: number;
  contributions: number;
};

/** Counts the signed-in user's records. Amounts and receipt text are not read. */
export async function countRecords(): Promise<RecordCounts> {
  const userId = activeUserId();
  if (!userId) return { expenses: 0, income: 0, goals: 0, contributions: 0 };
  const db = await getDb();
  const [expenses, income, goals, contributions] = await Promise.all([
    countOwned(db, 'SELECT COUNT(*) AS total FROM expenses WHERE user_id = ?', userId),
    countOwned(db, 'SELECT COUNT(*) AS total FROM income_received WHERE user_id = ?', userId),
    countOwned(db, 'SELECT COUNT(*) AS total FROM savings_goals WHERE user_id = ?', userId),
    countOwned(
      db,
      `SELECT COUNT(*) AS total FROM savings_contributions c
       JOIN savings_goals g ON g.id = c.goal_id WHERE g.user_id = ?`,
      userId,
    ),
  ]);
  return { expenses, income, goals, contributions };
}

async function countOwned(db: Awaited<ReturnType<typeof getDb>>, sql: string, userId: string): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(sql, userId);
  return row?.total ?? 0;
}
