import { FINANCIAL_RESET_VERSION, shouldWipeFinancialData } from './reset';

export type LocalAccount = {
  id: string;
  fullName: string;
  mobile: string;
};

export type StoredIncome = {
  id: string;
  userId: string;
  name: string;
  amountMinor: number;
  receivedOn: string;
  scheduleId: string | null;
};

export type StoredSchedule = {
  id: string;
  userId: string;
  name: string;
  amountMinor: number;
};

export type StoredExpense = {
  id: string;
  userId: string;
  name: string;
  merchant: string | null;
  category: string;
  amountMinor: number;
  date: string | null;
};

/** In-memory picture of what the next launch reads back from the device. */
export type Books = {
  version: number;
  users: LocalAccount[];
  sessionUserId: string | null;
  income: StoredIncome[];
  schedules: StoredSchedule[];
  expenses: StoredExpense[];
};

/** Copies a saved snapshot the way a restart reads the last persisted state. */
export function openBooks(saved: Books): Books {
  return {
    version: saved.version,
    users: saved.users.map((user) => ({ ...user })),
    sessionUserId: saved.sessionUserId,
    income: saved.income.map((row) => ({ ...row })),
    schedules: saved.schedules.map((row) => ({ ...row })),
    expenses: saved.expenses.map((row) => ({ ...row })),
  };
}

/**
 * Clears financial rows once when the stored version is older than the reset.
 * Accounts stay, so registration and login still work afterwards.
 */
export function applyFinancialReset(books: Books): { books: Books; wiped: boolean } {
  if (!shouldWipeFinancialData(books.version)) return { books, wiped: false };
  return {
    wiped: true,
    books: {
      ...books,
      version: FINANCIAL_RESET_VERSION,
      income: [],
      schedules: [],
      expenses: [],
    },
  };
}

/** Adds a local account. The same mobile number cannot be registered twice. */
export function registerAccount(books: Books, account: LocalAccount): Books {
  if (books.users.some((user) => user.mobile === account.mobile)) throw new Error('mobile-taken');
  return { ...books, users: [...books.users, account], sessionUserId: account.id };
}

/** Removes one received income row owned by this user and leaves every other row. */
export function deleteReceivedIncome(books: Books, userId: string, id: string): Books {
  return { ...books, income: books.income.filter((row) => !(row.id === id && row.userId === userId)) };
}

/** Removes a schedule only. Received rows that came from it stay in history. */
export function deleteIncomeSchedule(books: Books, userId: string, id: string): Books {
  return { ...books, schedules: books.schedules.filter((row) => !(row.id === id && row.userId === userId)) };
}

export function incomeForUser(books: Books, userId: string): StoredIncome[] {
  return books.income.filter((row) => row.userId === userId);
}

export function expensesForUser(books: Books, userId: string): StoredExpense[] {
  return books.expenses.filter((row) => row.userId === userId);
}

/** Sums received income only. Pass schedules separately; they are not added here. */
export function receivedMinor(rows: { amountMinor: number }[]): number {
  return rows.reduce((total, row) => total + row.amountMinor, 0);
}
