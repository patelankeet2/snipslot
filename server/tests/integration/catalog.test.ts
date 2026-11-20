import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { BookingModel } from '../../src/models/Booking';
import { DEFAULT_OPENING_HOURS } from '../../src/repositories/SettingsRepository';
import { clearTestDb, startTestDb, stopTestDb } from '../helpers/db';
import { createUser, seedShop } from '../helpers/factory';

const app = createApp();

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

describe('services', () => {
  it('lets the owner create, read, update and delete a service', async () => {
    const { auth } = await createUser('owner');

    const created = await request(app)
      .post('/api/services')
      .set(auth)
      .send({ name: 'Hot Towel Shave', durationMin: 30, price: 30 });
    expect(created.status).toBe(201);
    const id = created.body.service.id;

    const read = await request(app).get(`/api/services/${id}`).set(auth);
    expect(read.body.service.name).toBe('Hot Towel Shave');

    const updated = await request(app).put(`/api/services/${id}`).set(auth).send({ price: 32 });
    expect(updated.body.service.price).toBe(32);

    const removed = await request(app).delete(`/api/services/${id}`).set(auth);
    expect(removed.body).toEqual({ archived: false });
    expect((await request(app).get(`/api/services/${id}`).set(auth)).status).toBe(404);
  });

  it('archives a service that already has bookings instead of deleting it', async () => {
    const { auth, user } = await createUser('owner');
    const { fade, jordan } = await seedShop();
    await BookingModel.create({
      customer: user._id,
      barber: jordan._id,
      service: fade._id,
      start: new Date('2030-01-07T21:00:00Z'),
      end: new Date('2030-01-07T21:45:00Z'),
      priceAtBooking: 45,
    });

    const res = await request(app).delete(`/api/services/${fade.id}`).set(auth);
    expect(res.body).toEqual({ archived: true });

    // hidden from customers, still visible to the owner with ?all=true
    const customer = await createUser('customer');
    const forCustomer = await request(app).get('/api/services').set(customer.auth);
    expect(forCustomer.body.services.map((s: { name: string }) => s.name)).not.toContain(
      'Skin Fade',
    );
    const forOwner = await request(app).get('/api/services?all=true').set(auth);
    expect(forOwner.body.services.map((s: { name: string }) => s.name)).toContain('Skin Fade');
  });

  it('stops customers changing the menu', async () => {
    const { auth } = await createUser('customer');
    const res = await request(app)
      .post('/api/services')
      .set(auth)
      .send({ name: 'Free', durationMin: 30, price: 0 });
    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('Only the shop owner can do this');
  });

  it('explains every invalid field at once', async () => {
    const { auth } = await createUser('owner');
    const res = await request(app)
      .post('/api/services')
      .set(auth)
      .send({ name: 'X', durationMin: 33, price: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { field: string }) => d.field).sort()).toEqual([
      'durationMin',
      'name',
      'price',
    ]);
  });

  it('rejects ids that are not real ids', async () => {
    const { auth } = await createUser('owner');
    expect((await request(app).get('/api/services/not-an-id').set(auth)).status).toBe(400);
  });

  it('only accepts photo links from our own bucket', async () => {
    const { auth } = await createUser('owner');
    const res = await request(app)
      .post('/api/services')
      .set(auth)
      .send({ name: 'Cut', durationMin: 30, price: 30, photoUrl: 'https://example.com/cat.jpg' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Upload the photo through the app first');
  });
});

describe('barbers', () => {
  it('will not remove a barber who still has upcoming bookings', async () => {
    const { auth, user } = await createUser('owner');
    const { fade, jordan } = await seedShop();
    await BookingModel.create({
      customer: user._id,
      barber: jordan._id,
      service: fade._id,
      start: new Date('2030-01-07T21:00:00Z'),
      end: new Date('2030-01-07T21:45:00Z'),
      priceAtBooking: 45,
    });

    const res = await request(app).delete(`/api/barbers/${jordan.id}`).set(auth);
    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain('Jordan still has 1 upcoming booking');
  });

  it('removes a barber with no bookings at all', async () => {
    const { auth } = await createUser('owner');
    const { mia } = await seedShop();
    const res = await request(app).delete(`/api/barbers/${mia.id}`).set(auth);
    expect(res.body).toEqual({ archived: false });
  });
});

describe('opening hours', () => {
  it('saves a new week and returns it in day order', async () => {
    const { auth } = await createUser('owner');
    const week = [...DEFAULT_OPENING_HOURS]
      .reverse()
      .map((h) => (h.day === 4 ? { ...h, close: '20:00' } : h));

    const res = await request(app)
      .put('/api/settings/hours')
      .set(auth)
      .send({ openingHours: week });
    expect(res.status).toBe(200);
    expect(res.body.settings.openingHours.map((h: { day: number }) => h.day)).toEqual([
      0, 1, 2, 3, 4, 5, 6,
    ]);
    expect(res.body.settings.openingHours[4].close).toBe('20:00');
  });
});
