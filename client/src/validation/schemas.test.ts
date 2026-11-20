import { describe, expect, it } from 'vitest';
import { barberFormSchema, dayHoursSchema, serviceFormSchema, toFieldErrors } from './schemas';

describe('service form rules', () => {
  const valid = { name: 'Skin Fade', description: '', durationMin: '45', price: '45' };

  it('accepts a normal service and turns the text inputs into numbers', () => {
    const r = serviceFormSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ durationMin: 45, price: 45 });
  });

  it('gives one clear message per bad field', () => {
    const r = serviceFormSchema.safeParse({ ...valid, name: 'X', durationMin: '33', price: '-5' });
    expect(toFieldErrors(r.error!)).toEqual({
      name: 'Name is too short',
      durationMin: 'Use 5 minute steps (5, 10, 15...)',
      price: 'Price cannot be negative',
    });
  });

  it('asks for a number when the box is not a number', () => {
    const r = serviceFormSchema.safeParse({ ...valid, price: 'free' });
    expect(toFieldErrors(r.error!).price).toBe('Enter a price');
  });
});

describe('barber form rules', () => {
  it('needs at least one working day', () => {
    const r = barberFormSchema.safeParse({ name: 'Mia', bio: '', workingDays: [] });
    expect(toFieldErrors(r.error!).workingDays).toBe('Pick at least one working day');
  });
});

describe('opening hours rules', () => {
  it('rejects closing before opening, but not on a closed day', () => {
    expect(
      dayHoursSchema.safeParse({ day: 1, open: '18:00', close: '09:00', closed: false }).success,
    ).toBe(false);
    expect(
      dayHoursSchema.safeParse({ day: 0, open: '18:00', close: '09:00', closed: true }).success,
    ).toBe(true);
  });
});
