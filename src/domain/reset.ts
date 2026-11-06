/** Bump this only when existing on-device financial rows must be cleared once. */
export const FINANCIAL_RESET_VERSION = 3;

/**
 * User-created money records. Login, the schema, and default categories are not in this list.
 * Old rows have no owner, so they are cleared instead of being given to the first account.
 */
export const CLEARED_FINANCIAL_TABLES = [
  'savings_contributions',
  'savings_goals',
  'expenses',
  'income_received',
  'income_schedules',
  'expense_schedules',
  'category_budgets',
] as const;

/** Kept across the one-time reset so registration and an existing local sign-in still work. */
export const RETAINED_ON_RESET = ['users', 'local_session', 'schema_version'] as const;

/**
 * True only when an older database still needs the one-time clear.
 * A missing version is a new install. The target version means the clear already ran.
 */
export function shouldWipeFinancialData(storedVersion: number | null, targetVersion = FINANCIAL_RESET_VERSION): boolean {
  return storedVersion !== null && storedVersion < targetVersion;
}
