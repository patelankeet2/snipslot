import { DateTime } from 'luxon';

// The server runs in UTC (Render) but the shop lives in Auckland time,
// so every "which day is it" question is answered in the shop's timezone.

export function todayIn(timezone: string): string {
  return DateTime.now().setZone(timezone).toISODate()!;
}

// Start and end of a calendar day in the shop's timezone, as real instants
export function dayRange(date: string, timezone: string) {
  const start = DateTime.fromISO(date, { zone: timezone }).startOf('day');
  if (!start.isValid) throw new Error(`Invalid date ${date}`);
  return {
    start: start.toJSDate(),
    end: start.plus({ days: 1 }).toJSDate(),
    weekday: start.weekday % 7,
  };
}
