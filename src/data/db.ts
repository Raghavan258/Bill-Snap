import * as SQLite from 'expo-sqlite';
import { FINANCIAL_RESET_VERSION, shouldWipeFinancialData, CLEARED_FINANCIAL_TABLES } from '../domain/reset';
import { clearStoredBills } from '../media/images';

const SCHEMA = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS local_session (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  user_id TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  merchant TEXT,
  transaction_date TEXT,
  amount_minor INTEGER NOT NULL,
  category TEXT NOT NULL,
  image_uri TEXT,
  notes TEXT,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  user_id TEXT
);
CREATE TABLE IF NOT EXISTS income_received (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  received_on TEXT NOT NULL,
  notes TEXT,
  schedule_id TEXT,
  created_at TEXT NOT NULL,
  user_id TEXT
);
CREATE TABLE IF NOT EXISTS income_schedules (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  frequency TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  user_id TEXT
);
CREATE TABLE IF NOT EXISTS expense_schedules (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  frequency TEXT NOT NULL,
  next_due TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  user_id TEXT
);
CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  target_minor INTEGER,
  monthly_plan_minor INTEGER,
  duration_months INTEGER,
  target_date TEXT,
  created_at TEXT NOT NULL,
  user_id TEXT
);
CREATE TABLE IF NOT EXISTS savings_contributions (
  id TEXT PRIMARY KEY NOT NULL,
  goal_id TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  contributed_on TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS category_budgets (
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  limit_minor INTEGER NOT NULL,
  PRIMARY KEY (user_id, category)
);
`;

const SCHEMA_VERSION = FINANCIAL_RESET_VERSION;
const USER_TABLES = ['expenses', 'income_received', 'income_schedules', 'expense_schedules', 'savings_goals'] as const;

let database: Promise<SQLite.SQLiteDatabase> | null = null;

/** Opens the on-device database once and creates tables if needed. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!database) database = openDatabase();
  return database;
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('billsnap.db');
  await db.execAsync(SCHEMA);
  await ensureVersion(db);
  return db;
}

/**
 * Upgrades an older database once.
 * Rows saved before accounts existed have no owner, so they are deleted instead of
 * being attached to whoever registers next. The version flag stops this running again.
 */
async function ensureVersion(db: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ version: number }>('SELECT version FROM schema_version LIMIT 1');
  if (!existing) {
    await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', SCHEMA_VERSION);
    return;
  }
  if (!shouldWipeFinancialData(existing.version, SCHEMA_VERSION)) return;
  await attachUserColumns(db);
  await ensureBudgetOwner(db);
  await clearFinancialRows(db);
  await clearStoredBills();
  await db.runAsync('UPDATE schema_version SET version = ?', SCHEMA_VERSION);
}

async function attachUserColumns(db: SQLite.SQLiteDatabase): Promise<void> {
  for (const table of USER_TABLES) await addUserColumn(db, table);
}

async function addUserColumn(db: SQLite.SQLiteDatabase, table: string): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (columns.some((column) => column.name === 'user_id')) return;
  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN user_id TEXT`);
}

async function ensureBudgetOwner(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(category_budgets)');
  if (columns.some((column) => column.name === 'user_id')) return;
  await db.execAsync('DROP TABLE IF EXISTS category_budgets');
  await db.execAsync(`CREATE TABLE category_budgets (
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    limit_minor INTEGER NOT NULL,
    PRIMARY KEY (user_id, category)
  )`);
}

async function clearFinancialRows(db: SQLite.SQLiteDatabase): Promise<void> {
  for (const table of CLEARED_FINANCIAL_TABLES) {
    await db.runAsync(`DELETE FROM ${table}`);
  }
}
