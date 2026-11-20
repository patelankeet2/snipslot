import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import { BookingModel } from '../../src/models/Booking';
import { bookingEvents } from '../../src/events/bookingEvents';
import { clearTestDb, startTestDb, stopTestDb } from '../helpers/db';
import { createUser, FUTURE_TUESDAY, seedShop } from '../helpers/factory';

const app = createApp();

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);
afterEach(() => vi.restoreAllMocks());

// shop, a customer and the free slots for a 45 minute fade with Jordan
async function setup() {
  const shop = await seedShop();
  const customer = await createUser('customer', 'Aroha');
  const slotsRes = await request(app)
    .get(`/api/slots?serviceId=${shop.fade.id}&barberId=${shop.jordan.id}&date=${FUTURE_TUESDAY}`)
    .set(customer.auth);
  return { ...shop, customer, slots: slotsRes.body.slots as { start: string; end: string }[] };
}

const book = (auth: Record<string, string>, body: object) =>
  request(app).post('/api/bookings').set(auth).send(body);

describe('free slots', () => {
  it('lists the free starts for the day in shop time', async () => {
    const { slots } = await setup();
    // 9:00 to 17:15 in 15 minute steps for a 45 minute service
    expect(slots).toHaveLength(34);
    expect(slots[0].start).toBe('2030-01-07T20:00:00.000Z');
  });

  it('has nothing on a Sunday', async () => {
    const { fade, jordan, customer } = await setup();
    const res = await request(app)
      .get(`/api/slots?serviceId=${fade.id}&barberId=${jordan.id}&date=2030-01-06`)
      .set(customer.auth);
    expect(res.body.slots).toEqual([]);
  });
});

describe('booking an appointment', () => {
  it('books a free slot, copies the price and tells the listeners', async () => {
    const emit = vi.spyOn(bookingEvents, 'emit');
    const { fade, jordan, customer, slots } = await setup();

    const res = await book(customer.auth, {
      serviceId: fade.id,
      barberId: jordan.id,
      start: slots[4].start,
      notes: 'Number 2 on the sides',
    });

    expect(res.status).toBe(201);
    expect(res.body.booking).toMatchObject({
      status: 'booked',
      priceAtBooking: 45,
      notes: 'Number 2 on the sides',
    });
    expect(res.body.booking.end).toBe(slots[4].end);
    expect(emit).toHaveBeenCalledWith(
      'booking.created',
      expect.objectContaining({
        customerName: 'Aroha',
        serviceName: 'Skin Fade',
        barberName: 'Jordan',
      }),
    );
  });

  it('refuses the same slot twice (409)', async () => {
    const { fade, jordan, customer, slots } = await setup();
    const body = { serviceId: fade.id, barberId: jordan.id, start: slots[4].start };
    expect((await book(customer.auth, body)).status).toBe(201);

    const other = await createUser('customer', 'Someone Else');
    const second = await book(other.auth, body);
    expect(second.status).toBe(409);
  });

  it('refuses a time that overlaps an existing booking', async () => {
    const { fade, jordan, customer, slots } = await setup();
    await book(customer.auth, { serviceId: fade.id, barberId: jordan.id, start: slots[4].start });
    // 15 minutes later still overlaps the 45 minute cut
    const res = await book(customer.auth, {
      serviceId: fade.id,
      barberId: jordan.id,
      start: slots[5].start,
    });
    expect(res.status).toBe(409);
  });

  it('refuses odd times that are not on the 15 minute grid', async () => {
    const { fade, jordan, customer } = await setup();
    const res = await book(customer.auth, {
      serviceId: fade.id,
      barberId: jordan.id,
      start: '2030-01-07T21:07:00.000Z',
    });
    expect(res.status).toBe(409);
  });

  it('refuses times in the past', async () => {
    const { fade, jordan, customer } = await setup();
    const res = await book(customer.auth, {
      serviceId: fade.id,
      barberId: jordan.id,
      start: '2020-01-07T21:00:00.000Z',
    });
    expect(res.status).toBe(409);
  });

  it('does not let the owner book through the customer route', async () => {
    const { fade, jordan, slots } = await setup();
    const owner = await createUser('owner');
    const res = await book(owner.auth, {
      serviceId: fade.id,
      barberId: jordan.id,
      start: slots[0].start,
    });
    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('This is only available to customers');
  });
});

describe('managing your own bookings', () => {
  async function booked() {
    const ctx = await setup();
    const res = await book(ctx.customer.auth, {
      serviceId: ctx.fade.id,
      barberId: ctx.jordan.id,
      start: ctx.slots[4].start,
    });
    return { ...ctx, booking: res.body.booking };
  }

  it('lists it under upcoming', async () => {
    const { customer, booking } = await booked();
    const res = await request(app).get('/api/bookings/mine').set(customer.auth);
    expect(res.body.bookings.map((b: { id: string }) => b.id)).toEqual([booking.id]);
  });

  it('moves it to a new time and frees the old one', async () => {
    const emit = vi.spyOn(bookingEvents, 'emit');
    const { customer, booking, slots, fade, jordan } = await booked();

    const res = await request(app)
      .put(`/api/bookings/${booking.id}`)
      .set(customer.auth)
      .send({ start: slots[20].start });
    expect(res.status).toBe(200);
    expect(res.body.booking.start).toBe(slots[20].start);
    expect(emit).toHaveBeenCalledWith(
      'booking.rescheduled',
      expect.objectContaining({ bookingId: booking.id }),
    );

    // the original time can be booked by someone else now
    const other = await createUser('customer');
    expect(
      (await book(other.auth, { serviceId: fade.id, barberId: jordan.id, start: slots[4].start }))
        .status,
    ).toBe(201);
  });

  it('can be moved within its own time window', async () => {
    const { customer, booking, slots } = await booked();
    // 15 minutes later overlaps the booking itself, which must not count as a clash
    const res = await request(app)
      .put(`/api/bookings/${booking.id}`)
      .set(customer.auth)
      .send({ start: slots[5].start });
    expect(res.status).toBe(200);
  });

  it('cancels it, keeps the record, and refuses a second cancel', async () => {
    const { customer, booking } = await booked();

    const res = await request(app).delete(`/api/bookings/${booking.id}`).set(customer.auth);
    expect(res.body.booking.status).toBe('cancelled');
    expect(await BookingModel.countDocuments()).toBe(1);

    const again = await request(app).delete(`/api/bookings/${booking.id}`).set(customer.auth);
    expect(again.status).toBe(409);
    expect(again.body.error.message).toBe('This booking is already cancelled');
  });

  it("stops one customer touching another customer's booking", async () => {
    const { booking } = await booked();
    const stranger = await createUser('customer', 'Stranger');

    for (const res of [
      await request(app).get(`/api/bookings/${booking.id}`).set(stranger.auth),
      await request(app).delete(`/api/bookings/${booking.id}`).set(stranger.auth),
    ]) {
      expect(res.status).toBe(403);
      expect(res.body.error.message).toBe('This booking belongs to someone else');
    }
  });
});

describe('owner schedule', () => {
  it('shows the day with names filled in', async () => {
    const { customer, fade, jordan, slots } = await setup();
    await book(customer.auth, { serviceId: fade.id, barberId: jordan.id, start: slots[0].start });
    const owner = await createUser('owner');

    const res = await request(app)
      .get(`/api/bookings/schedule?date=${FUTURE_TUESDAY}`)
      .set(owner.auth);
    expect(res.body.timezone).toBe('Pacific/Auckland');
    expect(res.body.bookings[0]).toMatchObject({
      customer: { name: 'Aroha' },
      barber: { name: 'Jordan' },
    });
  });

  it('can mark a booking from today as completed, but not a future one', async () => {
    const { customer, fade, jordan, slots } = await setup();
    const owner = await createUser('owner');

    // one that started an hour ago, written straight to the database
    const earlier = await BookingModel.create({
      customer: customer.user._id,
      barber: jordan._id,
      service: fade._id,
      start: new Date(Date.now() - 60 * 60 * 1000),
      end: new Date(Date.now() - 15 * 60 * 1000),
      priceAtBooking: 45,
    });
    const done = await request(app)
      .patch(`/api/bookings/${earlier.id}/status`)
      .set(owner.auth)
      .send({ status: 'completed' });
    expect(done.body.booking.status).toBe('completed');

    const future = await book(customer.auth, {
      serviceId: fade.id,
      barberId: jordan.id,
      start: slots[0].start,
    });
    const tooSoon = await request(app)
      .patch(`/api/bookings/${future.body.booking.id}/status`)
      .set(owner.auth)
      .send({ status: 'no_show' });
    expect(tooSoon.status).toBe(400);
  });

  it('is owner only', async () => {
    const { customer } = await setup();
    expect((await request(app).get('/api/bookings/schedule').set(customer.auth)).status).toBe(403);
  });
});
