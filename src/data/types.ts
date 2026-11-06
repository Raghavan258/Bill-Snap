export type ExpenseRow = {
  id: string;
  name: string;
  merchant: string | null;
  transaction_date: string | null;
  amount_minor: number;
  category: string;
  image_uri: string | null;
  notes: string | null;
  source: string;
  created_at: string;
};

export type NewExpense = {
  id: string;
  name: string;
  merchant: string | null;
  transactionDate: string | null;
  amountMinor: number;
  category: string;
  imageUri: string | null;
  notes: string | null;
  source: 'scan' | 'gallery' | 'manual' | 'recurring';
  createdAt: string;
};

export type IncomeRow = {
  id: string;
  name: string;
  category: string;
  amount_minor: number;
  received_on: string;
  notes: string | null;
  schedule_id: string | null;
  created_at: string;
};

export type IncomeScheduleRow = {
  id: string;
  name: string;
  category: string;
  amount_minor: number;
  frequency: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
};

export type ExpenseScheduleRow = {
  id: string;
  name: string;
  category: string;
  amount_minor: number;
  frequency: string;
  next_due: string;
  notes: string | null;
  created_at: string;
};

export type GoalRow = {
  id: string;
  kind: string;
  name: string;
  target_minor: number | null;
  monthly_plan_minor: number | null;
  duration_months: number | null;
  target_date: string | null;
  created_at: string;
  saved_minor: number;
};

export type ContributionRow = {
  id: string;
  goal_id: string;
  amount_minor: number;
  contributed_on: string;
  note: string | null;
  created_at: string;
};
