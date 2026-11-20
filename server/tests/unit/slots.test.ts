import { describe, expect, it } from 'vitest';
import { computeSlots, type SlotInput } from '../../src/utils/slots';
import { DEFAULT_OPENING_HOURS } from '../../src/repositories/SettingsRepository';

// Tuesday 8 Jan 2030 in Auckland (NZDT, UTC+13), well in the future
const base: SlotInput = {
  date: '2030-01-08',
  timezone: 'Pacific/Auckland',
  openingHours: DEFAULT_OPENING_HOURS, // Tue 09:00 to 18:00
  slotStepMin: 15,
  workingDays: [1, 2, 3, 4, 5],
  durationMin: 30,
  busy: [],
  now: new Date('2029-12-01T00:00:00Z'),
};

describe('computeSlots', () => {
  it('offers every 15 minute start that fits a 30 minute cut between 9 and 6', () => {
    const slots = computeSlots(base);
    // 9:00 to 17:30 in 15 minute steps = 35 starts
    expect(slots).toHaveLength(35);
  });

  it('works in shop time: 9am in Auckland is 8pm the previous day in UTC', () => {
    const [first] = computeSlots(base);
    expect(first.start).toBe('2030-01-07T20:00:00.000Z');
    expect(first.end).toBe('2030-01-07T20:30:00.000Z');
  });

  it('never offers a slot that would run past closing time', () => {
    const slots = computeSlots({ ...base, durationMin: 45 });
    const last = slots.at(-1)!;
    // 17:15 + 45 min = 18:00 exactly, 17:30 would finish at 18:15
    expect(last.end).toBe('2030-01-08T05:00:00.000Z');
  });

  it('returns nothing on a day the shop is closed (Sunday)', () => {
    expect(computeSlots({ ...base, date: '2030-01-06' })).toEqual([]);
  });

  it('returns nothing on a day the barber does not work', () => {
    expect(computeSlots({ ...base, workingDays: [1, 3, 5] })).toEqual([]);
  });

  it('skips times that clash with an existing booking', () => {
    // existing booking 10:00 to 10:45 Auckland time
    const busy = [
      { start: new Date('2030-01-07T21:00:00Z'), end: new Date('2030-01-07T21:45:00Z') },
    ];
    const slots = computeSlots({ ...base, busy });
    const starts = slots.map((s) => s.start);

    // 9:30 ends at 10:00 so it still fits, 9:45 would overlap
    expect(starts).toContain('2030-01-07T20:30:00.000Z');
    expect(starts).not.toContain('2030-01-07T20:45:00.000Z');
    expect(starts).not.toContain('2030-01-07T21:00:00.000Z');
    expect(starts).not.toContain('2030-01-07T21:30:00.000Z');
    // 10:45 starts right as the other one ends, which is fine
    expect(starts).toContain('2030-01-07T21:45:00.000Z');
    expect(slots).toHaveLength(35 - 4);
  });

  it('hides slots that have already started today', () => {
    // pretend it is 11:05 am in Auckland on the day
    const now = new Date('2030-01-07T22:05:00Z');
    const slots = computeSlots({ ...base, now });
    expect(slots[0].start).toBe('2030-01-07T22:15:00.000Z'); // 11:15
  });

  it('returns nothing for an invalid date', () => {
    expect(computeSlots({ ...base, date: '2030-02-31' })).toEqual([]);
  });
});
