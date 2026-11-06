const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export type ParsedDate = { iso: string; ambiguous: boolean };

/** Local calendar date as YYYY-MM-DD. Avoids UTC shifts. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function monthRange(year: number, monthIndex: number): { start: string; end: string } {
  const last = daysInMonth(year, monthIndex);
  const month = String(monthIndex + 1).padStart(2, '0');
  return { start: `${year}-${month}-01`, end: `${year}-${month}-${String(last).padStart(2, '0')}` };
}

export function isIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null;
}

export function parseIsoDate(value: string): ParsedDate | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const iso = buildIso(Number(match[1]), Number(match[2]), Number(match[3]));
  return iso ? { iso, ambiguous: false } : null;
}

/** Parses receipt dates. Day-month-year is assumed for numeric dates. */
export function parseReceiptDate(raw: string): ParsedDate | null {
  const text = raw.trim();
  const named = text.match(/(\d{1,2})[\s./-]([A-Za-z]{3,9}),?[\s./-]+(\d{2,4})/);
  if (named) return fromNamed(named[1], named[2], named[3]);
  const iso = text.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (iso) {
    const built = buildIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));
    return built ? { iso: built, ambiguous: false } : null;
  }
  const numeric = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (!numeric) return null;
  return fromDayMonth(numeric[1], numeric[2], numeric[3]);
}

export function addFrequency(iso: string, frequency: 'weekly' | 'monthly' | 'yearly'): string | null {
  const parsed = parseIsoDate(iso);
  if (!parsed) return null;
  const [year, month, day] = parsed.iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (frequency === 'weekly') date.setDate(date.getDate() + 7);
  if (frequency === 'monthly') date.setMonth(date.getMonth() + 1);
  if (frequency === 'yearly') date.setFullYear(date.getFullYear() + 1);
  return toIsoDate(date);
}

/** Moves a due date forward until it is after `today`. Caps the loop. */
export function advanceUntilAfter(
  iso: string,
  frequency: 'weekly' | 'monthly' | 'yearly',
  today: string,
): string | null {
  let cursor = iso;
  for (let step = 0; step < 36; step += 1) {
    const next = addFrequency(cursor, frequency);
    if (!next) return null;
    cursor = next;
    if (cursor > today) return cursor;
  }
  return cursor;
}

function fromNamed(day: string, monthName: string, year: string): ParsedDate | null {
  const month = MONTHS[monthName.slice(0, 3).toLowerCase()];
  if (!month) return null;
  const iso = buildIso(expandYear(year), month, Number(day));
  return iso ? { iso, ambiguous: false } : null;
}

function fromDayMonth(day: string, month: string, year: string): ParsedDate | null {
  const dayNum = Number(day);
  const monthNum = Number(month);
  const iso = buildIso(expandYear(year), monthNum, dayNum);
  if (!iso) return null;
  const ambiguous = dayNum <= 12 && monthNum <= 12 && dayNum !== monthNum;
  return { iso, ambiguous };
}

function expandYear(year: string): number {
  const value = Number(year);
  if (year.length === 4) return value;
  return value >= 70 ? 1900 + value : 2000 + value;
}

function buildIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1990 || year > 2100) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return toIsoDate(date);
}
