const PAISA_PER_RUPEE = 100;
const MAX_MINOR = 100_000_000_00;

/** Formats integer paise with Indian grouping, for example ₹1,23,456.70. */
export function formatMinor(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(Math.trunc(minor));
  const rupees = Math.floor(abs / PAISA_PER_RUPEE);
  const paise = abs % PAISA_PER_RUPEE;
  return `${sign}₹${groupIndian(rupees)}.${String(paise).padStart(2, '0')}`;
}

/** Parses a rupee string into paise. Returns null when the text is not an amount. */
export function parseAmountToMinor(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/₹/g, '')
    .replace(/inr/gi, '')
    .replace(/rs\.?/gi, '')
    .replace(/\/-$/, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '');
  const match = cleaned.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = (match[2] ?? '').padEnd(2, '0');
  if (!Number.isSafeInteger(whole)) return null;
  const minor = whole * PAISA_PER_RUPEE + Number(fraction);
  if (minor <= 0 || minor > MAX_MINOR) return null;
  return minor;
}

/** Renders paise as a plain number the amount field can edit. */
export function minorToInput(minor: number): string {
  const abs = Math.abs(Math.trunc(minor));
  const rupees = Math.floor(abs / PAISA_PER_RUPEE);
  const paise = abs % PAISA_PER_RUPEE;
  if (paise === 0) return String(rupees);
  return `${rupees}.${String(paise).padStart(2, '0')}`;
}

/** Turns a SQLite aggregate into integer paise. Strings and empty results become a number. */
export function coerceMinor(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return Math.trunc(numeric);
  }
  return 0;
}

/** Parses user input that may be incomplete, such as an empty field. */
export function parseUserAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '0' || trimmed === '0.0' || trimmed === '0.00') return null;
  return parseAmountToMinor(trimmed);
}

function groupIndian(value: number): string {
  const digits = String(value);
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3);
  const tail = digits.slice(-3);
  const pairs = head.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${pairs},${tail}`;
}
