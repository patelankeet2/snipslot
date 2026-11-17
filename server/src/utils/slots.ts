import { DateTime } from 'luxon';
import type { IOpeningHours } from '../models/ShopSettings';

export interface SlotInput {
  date: string; // YYYY-MM-DD in the shop's timezone
  timezone: string;
  openingHours: IOpeningHours[];
  slotStepMin: number;
  workingDays: number[]; // the barber's days, 0 = Sunday
  durationMin: number; // length of the chosen service
  busy: { start: Date; end: Date }[]; // the barber's existing bookings that day
  now?: Date;
}

export interface Slot {
  start: string; // ISO instant
  end: string;
}

// Kept as a pure function (no database, no clock unless passed in)
// so it is easy to unit test with fixed values.
export function computeSlots(input: SlotInput): Slot[] {
  const { date, timezone, openingHours, slotStepMin, workingDays, durationMin, busy } = input;
  const now = DateTime.fromJSDate(input.now ?? new Date());

  const day = DateTime.fromISO(date, { zone: timezone });
  if (!day.isValid) return [];

  // luxon counts Monday = 1 ... Sunday = 7, our data uses Sunday = 0
  const weekday = day.weekday % 7;
  const hours = openingHours.find((h) => h.day === weekday);
  if (!hours || hours.closed || !workingDays.includes(weekday)) return [];

  const at = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return day.set({ hour, minute, second: 0, millisecond: 0 });
  };
  const open = at(hours.open);
  const close = at(hours.close);

  const slots: Slot[] = [];
  for (
    let start = open;
    start.plus({ minutes: durationMin }) <= close;
    start = start.plus({ minutes: slotStepMin })
  ) {
    const end = start.plus({ minutes: durationMin });

    // no booking in the past (or the minute we are in)
    if (start <= now) continue;

    // two ranges clash when each starts before the other ends
    const clashes = busy.some((b) => start.toJSDate() < b.end && end.toJSDate() > b.start);
    if (clashes) continue;

    slots.push({ start: start.toUTC().toISO()!, end: end.toUTC().toISO()! });
  }
  return slots;
}
