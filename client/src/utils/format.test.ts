import { describe, expect, it } from 'vitest';
import {
  dateParts,
  formatDuration,
  formatLongDate,
  formatPrice,
  formatShortDate,
  formatTime,
  formatWorkingDays,
  partOfDay,
  shiftDay,
  weekdayOf,
} from './format';

describe('plain calendar days', () => {
  it('moves forward and back across month and year ends', () => {
    expect(shiftDay('2026-11-30', 1)).toBe('2026-12-01');
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('keeps "today" as today (the bug that showed 16 instead of 17 in NZ)', () => {
    expect(shiftDay('2026-11-17', 0)).toBe('2026-11-17');
  });

  it('knows the weekday of a day, Sunday = 0', () => {
    expect(weekdayOf('2026-11-22')).toBe(0); // Sunday
    expect(weekdayOf('2026-11-17')).toBe(2); // Tuesday
  });

  it('writes days out in full and short form', () => {
    expect(formatLongDate('2026-11-17')).toBe('Tuesday, 17 November');
    expect(formatShortDate('2026-11-17')).toMatch(/Tue,? 17 Nov/);
  });
});

describe('moments in time are shown in shop time (Auckland)', () => {
  // 21:00 UTC on 17 Nov is 10:00 am on 18 Nov in Auckland (NZDT, UTC+13)
  const instant = '2026-11-17T21:00:00.000Z';

  it('formats the time and the date on the shop side of midnight', () => {
    expect(formatTime(instant).toLowerCase()).toMatch(/^10:00\s?am$/);
    expect(dateParts(instant)).toEqual({ weekday: 'Wed', day: '18', month: 'Nov' });
  });

  it('groups slots into parts of the day', () => {
    expect(partOfDay(instant)).toBe('Morning');
    expect(partOfDay('2026-11-18T01:00:00.000Z')).toBe('Afternoon'); // 2 pm
    expect(partOfDay('2026-11-18T05:00:00.000Z')).toBe('Evening'); // 6 pm
  });
});

describe('prices, durations and working days', () => {
  it('shows NZ dollars', () => {
    expect(formatPrice(35)).toBe('$35.00');
    expect(formatPrice(19.5)).toBe('$19.50');
  });

  it('shows minutes and hours in a friendly way', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(90)).toBe('1 h 30 min');
  });

  it('lists working days in order', () => {
    expect(formatWorkingDays([5, 1, 3])).toBe('Mon, Wed, Fri');
    expect(formatWorkingDays([])).toBe('Not working');
    expect(formatWorkingDays([0, 1, 2, 3, 4, 5, 6])).toBe('Every day');
  });
});
