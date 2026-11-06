import { coerceMinor } from '../domain/money';
import { getDb } from './db';
import { activeUserId, requireUserId } from './scope';
import type { ContributionRow, GoalRow } from './types';

const GOAL_SQL = `
SELECT g.id, g.kind, g.name, g.target_minor, g.monthly_plan_minor, g.duration_months, g.target_date, g.created_at,
       COALESCE(SUM(c.amount_minor), 0) AS saved_minor
FROM savings_goals g
LEFT JOIN savings_contributions c ON c.goal_id = g.id
`;

export async function insertGoal(input: {
  id: string;
  kind: 'monthly' | 'emergency' | 'purchase';
  name: string;
  targetMinor: number | null;
  monthlyPlanMinor: number | null;
  durationMonths: number | null;
  targetDate: string | null;
  createdAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO savings_goals
      (id, kind, name, target_minor, monthly_plan_minor, duration_months, target_date, created_at, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.kind,
    input.name,
    input.targetMinor,
    input.monthlyPlanMinor,
    input.durationMonths,
    input.targetDate,
    input.createdAt,
    requireUserId(),
  );
}

export async function listGoals(): Promise<GoalRow[]> {
  const userId = activeUserId();
  if (!userId) return [];
  const db = await getDb();
  return db.getAllAsync<GoalRow>(`${GOAL_SQL} WHERE g.user_id = ? GROUP BY g.id ORDER BY g.created_at DESC`, userId);
}

export async function getGoal(id: string): Promise<GoalRow | null> {
  const userId = activeUserId();
  if (!userId) return null;
  const db = await getDb();
  return db.getFirstAsync<GoalRow>(`${GOAL_SQL} WHERE g.id = ? AND g.user_id = ? GROUP BY g.id`, id, userId);
}

export async function deleteGoal(id: string): Promise<void> {
  const userId = requireUserId();
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM savings_contributions WHERE goal_id IN (SELECT id FROM savings_goals WHERE id = ? AND user_id = ?)`,
    id,
    userId,
  );
  await db.runAsync('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', id, userId);
}

export async function insertContribution(input: {
  id: string;
  goalId: string;
  amountMinor: number;
  contributedOn: string;
  note: string | null;
  createdAt: string;
}): Promise<void> {
  const goal = await getGoal(input.goalId);
  if (!goal) throw new Error('goal');
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO savings_contributions
      (id, goal_id, amount_minor, contributed_on, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.id,
    input.goalId,
    input.amountMinor,
    input.contributedOn,
    input.note,
    input.createdAt,
  );
}

export async function listContributions(goalId: string): Promise<ContributionRow[]> {
  const userId = activeUserId();
  if (!userId) return [];
  const db = await getDb();
  return db.getAllAsync<ContributionRow>(
    `SELECT c.* FROM savings_contributions c
     JOIN savings_goals g ON g.id = c.goal_id
     WHERE c.goal_id = ? AND g.user_id = ?
     ORDER BY c.contributed_on DESC`,
    goalId,
    userId,
  );
}

export async function sumContributionsBetween(start: string, end: string): Promise<number> {
  const userId = activeUserId();
  if (!userId) return 0;
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(c.amount_minor), 0) AS total
     FROM savings_contributions c
     JOIN savings_goals g ON g.id = c.goal_id
     WHERE g.user_id = ? AND c.contributed_on >= ? AND c.contributed_on <= ?`,
    userId,
    start,
    end,
  );
  return coerceMinor(row?.total);
}
