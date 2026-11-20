import { describe, expect, it } from 'vitest';
import { serviceCreateSchema, serviceUpdateSchema } from '../../src/validators/service.schemas';
import { barberCreateSchema } from '../../src/validators/barber.schemas';
import { hoursUpdateSchema } from '../../src/validators/settings.schemas';
import { bookingCreateSchema } from '../../src/validators/booking.schemas';
import { DEFAULT_OPENING_HOURS } from '../../src/repositories/SettingsRepository';

const fieldsWithErrors = (result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[] }[] };
}) => result.error?.issues.map((i) => i.path.join('.')) ?? [];

describe('service validation', () => {
  it('accepts a normal service and trims the name', () => {
    const r = serviceCreateSchema.safeParse({ name: '  Skin Fade ', durationMin: 45, price: 45 });
    expect(r.success).toBe(true);
    expect(r.data?.name).toBe('Skin Fade');
  });

  it('turns numbers sent as text into numbers', () => {
    const r = serviceCreateSchema.safeParse({ name: 'Trim', durationMin: '20', price: '19.5' });
    expect(r.data).toMatchObject({ durationMin: 20, price: 19.5 });
  });

  it('rejects a duration that is not in 5 minute steps', () => {
    expect(
      fieldsWithErrors(serviceCreateSchema.safeParse({ name: 'Cut', durationMin: 33, price: 30 })),
    ).toEqual(['durationMin']);
  });

  it('rejects a negative price and a one letter name together', () => {
    const fields = fieldsWithErrors(
      serviceCreateSchema.safeParse({ name: 'X', durationMin: 30, price: -5 }),
    );
    expect(fields).toEqual(expect.arrayContaining(['name', 'price']));
  });

  it('drops fields we do not know about', () => {
    const r = serviceCreateSchema.safeParse({
      name: 'Cut',
      durationMin: 30,
      price: 30,
      isAdmin: true,
    });
    expect(r.data).not.toHaveProperty('isAdmin');
  });

  it('needs at least one field when updating', () => {
    expect(serviceUpdateSchema.safeParse({}).success).toBe(false);
    expect(serviceUpdateSchema.safeParse({ price: 50 }).success).toBe(true);
  });
});

describe('barber validation', () => {
  it('defaults to Monday to Friday', () => {
    expect(barberCreateSchema.parse({ name: 'Sam' }).workingDays).toEqual([1, 2, 3, 4, 5]);
  });

  it('rejects the same day twice and days outside 0 to 6', () => {
    expect(barberCreateSchema.safeParse({ name: 'Sam', workingDays: [1, 1] }).success).toBe(false);
    expect(barberCreateSchema.safeParse({ name: 'Sam', workingDays: [7] }).success).toBe(false);
  });
});

describe('opening hours validation', () => {
  it('accepts the default week', () => {
    expect(hoursUpdateSchema.safeParse({ openingHours: DEFAULT_OPENING_HOURS }).success).toBe(true);
  });

  it('rejects closing before opening on an open day', () => {
    const week = DEFAULT_OPENING_HOURS.map((h) =>
      h.day === 1 ? { ...h, open: '18:00', close: '09:00' } : h,
    );
    const r = hoursUpdateSchema.safeParse({ openingHours: week });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe('Closing time must be after opening time');
  });

  it('ignores the times on a closed day', () => {
    const week = DEFAULT_OPENING_HOURS.map((h) =>
      h.day === 0 ? { ...h, open: '18:00', close: '09:00' } : h,
    );
    expect(hoursUpdateSchema.safeParse({ openingHours: week }).success).toBe(true);
  });

  it('needs all seven days, each once', () => {
    expect(
      hoursUpdateSchema.safeParse({ openingHours: DEFAULT_OPENING_HOURS.slice(0, 6) }).success,
    ).toBe(false);
  });

  it('rejects a badly formatted time', () => {
    const week = DEFAULT_OPENING_HOURS.map((h) => (h.day === 2 ? { ...h, open: '9am' } : h));
    expect(hoursUpdateSchema.safeParse({ openingHours: week }).success).toBe(false);
  });
});

describe('booking validation', () => {
  const ids = { serviceId: 'a'.repeat(24), barberId: 'b'.repeat(24) };

  it('accepts ids and an ISO time', () => {
    expect(
      bookingCreateSchema.safeParse({ ...ids, start: '2030-01-07T21:00:00.000Z' }).success,
    ).toBe(true);
  });

  it('rejects ids that are not Mongo ids and times that are not ISO', () => {
    const fields = fieldsWithErrors(
      bookingCreateSchema.safeParse({
        serviceId: '123',
        barberId: ids.barberId,
        start: 'tomorrow 10am',
      }),
    );
    expect(fields).toEqual(expect.arrayContaining(['serviceId', 'start']));
  });

  it('limits notes to 300 characters', () => {
    expect(
      bookingCreateSchema.safeParse({
        ...ids,
        start: '2030-01-07T21:00:00.000Z',
        notes: 'x'.repeat(301),
      }).success,
    ).toBe(false);
  });
});
