import { config } from '../config';

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const money = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' });

export function formatPrice(value: number) {
  return money.format(value);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Times are always shown in the shop's timezone, whatever the phone is set to
export function formatTime(iso: string, timeZone = config.shopTimezone) {
  return new Intl.DateTimeFormat('en-NZ', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso));
}

// A plain calendar day ("2026-11-18") has no timezone. Treat it as UTC midday
// and format it in UTC so the day never shifts, whatever timezone the phone is in.
// (Using local time here showed "today" as yesterday in New Zealand.)
function dayToDate(isoDay: string) {
  const [y, m, d] = isoDay.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function formatLongDate(isoDay: string) {
  return new Intl.DateTimeFormat('en-NZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(dayToDate(isoDay));
}

// Today's date (YYYY-MM-DD) in the shop's timezone
export function todayInShop(timeZone = config.shopTimezone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

export function shiftDay(isoDay: string, days: number) {
  const d = dayToDate(isoDay);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// weekday number (0 = Sunday) for a plain YYYY-MM-DD day
export function weekdayOf(isoDay: string) {
  return dayToDate(isoDay).getUTCDay();
}

// "Wed 18 Nov" style label for date chips and cards
export function formatShortDate(iso: string, timeZone = config.shopTimezone) {
  // plain days are formatted in UTC (see dayToDate), real instants in the shop's timezone
  const isDay = iso.length === 10;
  return new Intl.DateTimeFormat('en-NZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: isDay ? 'UTC' : timeZone,
  }).format(isDay ? dayToDate(iso) : new Date(iso));
}

// separate pieces for the little calendar badge on booking cards
export function dateParts(iso: string, timeZone = config.shopTimezone) {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return { weekday: get('weekday'), day: get('day'), month: get('month') };
}

// which part of the day a slot falls in, for grouping the slot grid
export function partOfDay(iso: string, timeZone = config.shopTimezone) {
  const hour = Number(
    new Intl.DateTimeFormat('en-NZ', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(
      new Date(iso),
    ),
  );
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export function formatWorkingDays(days: number[]) {
  if (days.length === 0) return 'Not working';
  if (days.length === 7) return 'Every day';
  return [...days]
    .sort()
    .map((d) => DAY_SHORT[d])
    .join(', ');
}
