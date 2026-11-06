export type GoalProgress = {
  savedMinor: number;
  targetMinor: number | null;
  remainingMinor: number | null;
  ratio: number | null;
};

/** Progress uses recorded contributions only. Planned amounts are ignored. */
export function goalProgress(savedMinor: number, targetMinor: number | null): GoalProgress {
  if (targetMinor === null || targetMinor <= 0) {
    return { savedMinor, targetMinor, remainingMinor: null, ratio: null };
  }
  const remainingMinor = Math.max(targetMinor - savedMinor, 0);
  return {
    savedMinor,
    targetMinor,
    remainingMinor,
    ratio: Math.min(savedMinor / targetMinor, 1),
  };
}

export function monthlyTargetTotal(monthlyMinor: number, durationMonths: number | null): number | null {
  if (durationMonths === null || durationMonths <= 0) return null;
  return monthlyMinor * durationMonths;
}
