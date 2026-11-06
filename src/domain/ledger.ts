export type LedgerKind = 'all' | 'income' | 'expense';

export type LedgerEntry = {
  id: string;
  kind: 'income' | 'expense';
  name: string;
  merchant: string | null;
  category: string;
  date: string | null;
  amountMinor: number;
};

export type LedgerQuery = {
  text: string;
  kind: LedgerKind;
  category: string;
  from: string;
  to: string;
};

/** Newest dated records first. Records with no date stay at the end. */
export function sortLedger(entries: LedgerEntry[]): LedgerEntry[] {
  return entries.slice().sort((left, right) => {
    const byDate = (right.date ?? '').localeCompare(left.date ?? '');
    if (byDate !== 0) return byDate;
    return left.name.localeCompare(right.name);
  });
}

/** Filters a combined income and expense history. Matching is local and case-insensitive. */
export function filterLedger(entries: LedgerEntry[], query: LedgerQuery): LedgerEntry[] {
  const text = query.text.trim().toLowerCase();
  return sortLedger(entries.filter((entry) => matchesLedger(entry, query, text)));
}

function matchesLedger(entry: LedgerEntry, query: LedgerQuery, text: string): boolean {
  if (query.kind !== 'all' && entry.kind !== query.kind) return false;
  if (query.category && entry.category !== query.category) return false;
  if (!matchesDate(entry.date, query.from, query.to)) return false;
  if (!text) return true;
  const name = entry.name.toLowerCase();
  const merchant = (entry.merchant ?? '').toLowerCase();
  return name.includes(text) || merchant.includes(text);
}

function matchesDate(date: string | null, from: string, to: string): boolean {
  const day = date?.slice(0, 10) ?? '';
  if (!day) return !from && !to;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}
