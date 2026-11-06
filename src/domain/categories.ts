export const EXPENSE_CATEGORIES = ['Food', 'Utilities', 'Groceries'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const INCOME_CATEGORIES = ['Salary', 'Rent', 'Freelance', 'Gift', 'Refund', 'Other'] as const;
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export const FREQUENCIES = ['weekly', 'monthly', 'yearly'] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return EXPENSE_CATEGORIES.some((category) => category === value);
}

export function isIncomeCategory(value: string): value is IncomeCategory {
  return INCOME_CATEGORIES.some((category) => category === value);
}

export function isFrequency(value: string): value is Frequency {
  return FREQUENCIES.some((frequency) => frequency === value);
}

export function frequencyLabel(frequency: Frequency): string {
  if (frequency === 'weekly') return 'Weekly';
  if (frequency === 'monthly') return 'Monthly';
  return 'Yearly';
}
