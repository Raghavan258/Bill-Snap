/** The values stored after review. Corrections replace whatever OCR suggested. */
export function savedExpenseFields(input: {
  merchant: string;
  date: string;
  amountMinor: number;
  category: string;
  notes: string;
}): {
  name: string;
  merchant: string;
  transactionDate: string;
  amountMinor: number;
  category: string;
  notes: string | null;
} {
  const merchant = input.merchant.trim();
  return {
    name: merchant,
    merchant,
    transactionDate: input.date.trim(),
    amountMinor: input.amountMinor,
    category: input.category,
    notes: input.notes.trim() || null,
  };
}
