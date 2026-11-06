export const OTHERS_CATEGORY = 'Others';

export type DonutSlice = {
  category: string;
  minor: number;
  share: number;
  percent: number;
};

/** Groups recorded expenses for the Overview donut. Blank categories become Others. */
export function expenseDonut(records: { category: string; amountMinor: number }[]): DonutSlice[] {
  const grouped = new Map<string, number>();
  for (const record of records) {
    const category = record.category.trim() || OTHERS_CATEGORY;
    grouped.set(category, (grouped.get(category) ?? 0) + record.amountMinor);
  }
  const total = [...grouped.values()].reduce((sum, minor) => sum + minor, 0);
  if (total <= 0) return [];
  const slices = [...grouped.entries()]
    .map(([category, minor]) => ({ category, minor, share: minor / total, percent: 0 }))
    .sort((left, right) => right.minor - left.minor || left.category.localeCompare(right.category));
  const percents = roundedPercents(slices.map((slice) => slice.share));
  return slices.map((slice, index) => ({ ...slice, percent: percents[index] ?? 0 }));
}

/** Largest-remainder percents so the displayed shares add up to 100. */
export function roundedPercents(shares: number[]): number[] {
  const floors = shares.map((share) => Math.floor(share * 100));
  let leftover = 100 - floors.reduce((sum, value) => sum + value, 0);
  const order = shares
    .map((share, index) => ({ index, fraction: share * 100 - Math.floor(share * 100) }))
    .sort((left, right) => right.fraction - left.fraction);
  const percents = floors.slice();
  for (const item of order) {
    if (leftover <= 0) break;
    percents[item.index] = (percents[item.index] ?? 0) + 1;
    leftover -= 1;
  }
  return percents;
}
