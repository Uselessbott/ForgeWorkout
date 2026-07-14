/** Date helpers. All dates are stored/compared as "yyyy-mm-dd" local strings. */

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const date = fromISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

/** Inclusive day difference: dateToDayNumber('2024-01-01','2024-01-01') === 0 */
export function dayDiff(startIso: string, targetIso: string): number {
  const start = fromISO(startIso);
  const target = fromISO(targetIso);
  const ms = target.getTime() - start.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function isPastOrToday(iso: string): boolean {
  return iso <= todayISO();
}

export function isToday(iso: string): boolean {
  return iso === todayISO();
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Returns the ISO date of the Monday on/before the given date. */
export function startOfWeek(iso: string): string {
  const date = fromISO(iso);
  const weekday = (date.getDay() + 6) % 7; // 0 = Monday
  return addDays(iso, -weekday);
}

export function weekdayLabel(index: number): string {
  return WEEKDAY_LABELS[index % 7];
}

export function monthLabel(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function firstWeekdayOfMonth(year: number, month: number): number {
  // 0 = Monday ... 6 = Sunday
  return (new Date(year, month, 1).getDay() + 6) % 7;
}
