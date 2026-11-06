import { isExpenseCategory, isFrequency, isIncomeCategory } from './categories';
import { isIsoDate } from './dates';
import { parseUserAmount } from './money';

export type FieldErrors = Record<string, string>;

const NAME_MAX = 80;
const NOTES_MAX = 280;

export function validateManualExpense(input: {
  name: string;
  amount: string;
  category: string;
  date: string;
  merchant: string;
  notes: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  requireName(input.name, errors);
  requireAmount(input.amount, errors);
  if (!isExpenseCategory(input.category)) errors.category = 'Choose a category.';
  optionalDate(input.date, errors);
  optionalBound(input.merchant, 'merchant', NAME_MAX, errors);
  optionalBound(input.notes, 'notes', NOTES_MAX, errors);
  return errors;
}

export function validateReviewedExpense(input: {
  merchant: string;
  amount: string;
  category: string;
  date: string;
  notes: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  requireName(input.merchant, errors, 'merchant', 'Enter the merchant.');
  requireAmount(input.amount, errors);
  if (!isExpenseCategory(input.category)) errors.category = 'Choose a category.';
  if (!input.date.trim()) errors.date = 'Enter the transaction date.';
  else if (!isIsoDate(input.date.trim())) errors.date = 'Use a real date.';
  optionalBound(input.notes, 'notes', NOTES_MAX, errors);
  return errors;
}

export function validateOneTimeIncome(input: {
  name: string;
  amount: string;
  category: string;
  date: string;
  notes: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  requireName(input.name, errors);
  requireAmount(input.amount, errors);
  if (!isIncomeCategory(input.category)) errors.category = 'Choose a category.';
  if (!isIsoDate(input.date.trim())) errors.date = 'Enter the date you received it.';
  optionalBound(input.notes, 'notes', NOTES_MAX, errors);
  return errors;
}

export function validateRecurringIncome(input: {
  name: string;
  amount: string;
  category: string;
  frequency: string;
  startDate: string;
  endDate: string;
  notes: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  requireName(input.name, errors);
  requireAmount(input.amount, errors);
  if (!isIncomeCategory(input.category)) errors.category = 'Choose a category.';
  if (!isFrequency(input.frequency)) errors.frequency = 'Choose how often it arrives.';
  if (!isIsoDate(input.startDate.trim())) errors.startDate = 'Enter a start date.';
  validateEndDate(input.startDate, input.endDate, errors);
  optionalBound(input.notes, 'notes', NOTES_MAX, errors);
  return errors;
}

export function validateSavingsGoal(input: {
  name: string;
  target: string;
  monthly: string;
  requireTarget: boolean;
  requireMonthly: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};
  requireName(input.name, errors);
  if (input.requireTarget) requireAmount(input.target, errors, 'target');
  else optionalAmount(input.target, 'target', errors);
  if (input.requireMonthly) requireAmount(input.monthly, errors, 'monthly');
  else optionalAmount(input.monthly, 'monthly', errors);
  return errors;
}

export function validateContribution(amount: string): FieldErrors {
  const errors: FieldErrors = {};
  requireAmount(amount, errors);
  return errors;
}

function requireName(value: string, errors: FieldErrors, key = 'name', message = 'Enter a name.'): void {
  const trimmed = value.trim();
  if (!trimmed) errors[key] = message;
  else if (trimmed.length > NAME_MAX) errors[key] = `Keep this under ${NAME_MAX} characters.`;
}

function requireAmount(value: string, errors: FieldErrors, key = 'amount'): void {
  if (parseUserAmount(value) === null) errors[key] = 'Enter an amount greater than zero.';
}

function optionalAmount(value: string, key: string, errors: FieldErrors): void {
  if (value.trim() && parseUserAmount(value) === null) errors[key] = 'Enter an amount greater than zero.';
}

function optionalDate(value: string, errors: FieldErrors): void {
  if (value.trim() && !isIsoDate(value.trim())) errors.date = 'Use a real date.';
}

function optionalBound(value: string, key: string, max: number, errors: FieldErrors): void {
  if (value.trim().length > max) errors[key] = `Keep this under ${max} characters.`;
}

function validateEndDate(start: string, end: string, errors: FieldErrors): void {
  const trimmed = end.trim();
  if (!trimmed) return;
  if (!isIsoDate(trimmed)) {
    errors.endDate = 'Use a real end date.';
    return;
  }
  if (isIsoDate(start.trim()) && trimmed < start.trim()) errors.endDate = 'End date must be on or after the start.';
}
