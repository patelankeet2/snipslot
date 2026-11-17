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

export function formatLongDate(isoDay: string) {
  // noon avoids the date flipping when converting a plain day to a Date
  return new Intl.DateTimeFormat('en-NZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${isoDay}T12:00:00`));
}

// Today's date (YYYY-MM-DD) in the shop's timezone
export function todayInShop(timeZone = config.shopTimezone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

export function shiftDay(isoDay: string, days: number) {
  const d = new Date(`${isoDay}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatWorkingDays(days: number[]) {
  if (days.length === 0) return 'Not working';
  if (days.length === 7) return 'Every day';
  return [...days]
    .sort()
    .map((d) => DAY_SHORT[d])
    .join(', ');
}
