export type BudgetStatus = {
  limitMinor: number | null;
  remainingMinor: number | null;
  overMinor: number;
  ratio: number | null;
};

/** Compares recorded spending with a configured limit. The limit is not an expense. */
export function budgetStatus(spentMinor: number, limitMinor: number | null): BudgetStatus {
  if (limitMinor === null || limitMinor <= 0) {
    return { limitMinor: null, remainingMinor: null, overMinor: 0, ratio: null };
  }
  return {
    limitMinor,
    remainingMinor: Math.max(limitMinor - spentMinor, 0),
    overMinor: Math.max(spentMinor - limitMinor, 0),
    ratio: Math.min(spentMinor / limitMinor, 1),
  };
}
