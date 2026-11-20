import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Replace the real push sender so tests never contact a browser push service.
// vi.mock is hoisted to the top of the file, so the fake has to be hoisted too.
const { sendNotification } = vi.hoisted(() => ({ sendNotification: vi.fn() }));
vi.mock('../../src/config/push', () => ({ webpush: { sendNotification } }));

import { createApp } from '../../src/app';
import { PushSubscriptionModel } from '../../src/models/PushSubscription';
import { BookingModel } from '../../src/models/Booking';
import { ReminderJob } from '../../src/jobs/reminderJob';
import { BookingRepository } from '../../src/repositories/BookingRepository';
import { SettingsRepository } from '../../src/repositories/SettingsRepository';
import { bookingEvents } from '../../src/events/bookingEvents';
import { clearTestDb, startTestDb, stopTestDb } from '../helpers/db';
import { createUser, seedShop } from '../helpers/factory';

const app = createApp();

const subscription = (n = 1) => ({
  endpoint: `https://fcm.googleapis.com/fcm/send/device-${n}`,
  expirationTime: null,
  keys: { p256dh: 'B'.repeat(87), auth: 'a'.repeat(22) },
});

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearTestDb();
  sendNotification.mockReset();
  sendNotification.mockResolvedValue({ statusCode: 201 });
});

describe('push subscriptions', () => {
  it('hands out the public VAPID key to anyone', async () => {
    const res = await request(app).get('/api/push/public-key');
    expect(res.body.publicKey).toBe(process.env.VAPID_PUBLIC_KEY);
  });

  it('saves a device once, even if it subscribes twice', async () => {
    const { auth } = await createUser('owner');
    await request(app).post('/api/push/subscribe').set(auth).send(subscription());
    const res = await request(app).post('/api/push/subscribe').set(auth).send(subscription());
    expect(res.status).toBe(201);
    expect(await PushSubscriptionModel.countDocuments()).toBe(1);
  });

  it('rejects a subscription that is not https or has bad keys', async () => {
    const { auth } = await createUser('owner');
    const res = await request(app)
      .post('/api/push/subscribe')
      .set(auth)
      .send({ endpoint: 'http://insecure.example/push', keys: { p256dh: 'x', auth: 'y' } });
    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
  });

  it('lets a user remove only their own device', async () => {
    const owner = await createUser('owner');
    const other = await createUser('customer');
    await request(app).post('/api/push/subscribe').set(owner.auth).send(subscription());

    await request(app)
      .delete('/api/push/subscribe')
      .set(other.auth)
      .send({ endpoint: subscription().endpoint });
    expect(await PushSubscriptionModel.countDocuments()).toBe(1);

    await request(app)
      .delete('/api/push/subscribe')
      .set(owner.auth)
      .send({ endpoint: subscription().endpoint });
    expect(await PushSubscriptionModel.countDocuments()).toBe(0);
  });
});

describe('sending pushes', () => {
  it('sends a test push to every device of the owner', async () => {
    const { auth } = await createUser('owner');
    await request(app).post('/api/push/subscribe').set(auth).send(subscription(1));
    await request(app).post('/api/push/subscribe').set(auth).send(subscription(2));

    const res = await request(app).post('/api/push/test').set(auth).send({});
    expect(res.body).toEqual({ sent: 2, removed: 0, failed: 0 });

    const [, payload] = sendNotification.mock.calls[0];
    expect(JSON.parse(payload)).toMatchObject({ title: 'Test notification', url: '/profile' });
  });

  it('forgets a device the push service says is gone (410)', async () => {
    const { auth } = await createUser('owner');
    await request(app).post('/api/push/subscribe').set(auth).send(subscription());
    sendNotification.mockRejectedValueOnce(Object.assign(new Error('Gone'), { statusCode: 410 }));

    const res = await request(app).post('/api/push/test').set(auth).send({});
    expect(res.body).toEqual({ sent: 0, removed: 1, failed: 0 });
    expect(await PushSubscriptionModel.countDocuments()).toBe(0);
  });

  it('does not let a customer send test pushes', async () => {
    const { auth } = await createUser('customer');
    expect((await request(app).post('/api/push/test').set(auth).send({})).status).toBe(403);
  });
});

describe('reminder job', () => {
  it('reminds each booking starting within the hour exactly once', async () => {
    const emit = vi.spyOn(bookingEvents, 'emit');
    const { fade, jordan } = await seedShop();
    const { user } = await createUser('customer', 'Aroha');
    const now = new Date('2030-01-07T20:00:00Z');

    const base = { customer: user._id, barber: jordan._id, service: fade._id, priceAtBooking: 45 };
    await BookingModel.create([
      // in 30 minutes: should be reminded
      { ...base, start: new Date('2030-01-07T20:30:00Z'), end: new Date('2030-01-07T21:15:00Z') },
      // in 3 hours: too early
      { ...base, start: new Date('2030-01-07T23:00:00Z'), end: new Date('2030-01-07T23:45:00Z') },
    ]);

    const job = new ReminderJob(new BookingRepository(), new SettingsRepository());
    expect(await job.run(now)).toEqual({ reminded: 1 });
    expect(emit).toHaveBeenCalledWith(
      'booking.reminder',
      expect.objectContaining({ customerName: 'Aroha' }),
    );

    // running again straight away must not remind the same booking twice
    expect(await job.run(now)).toEqual({ reminded: 0 });
    emit.mockRestore();
  });

  it('is protected by the cron secret', async () => {
    expect((await request(app).post('/api/jobs/reminders')).status).toBe(401);
    expect(
      (await request(app).post('/api/jobs/reminders').set('x-cron-secret', 'wrong')).status,
    ).toBe(401);

    const ok = await request(app)
      .post('/api/jobs/reminders')
      .set('x-cron-secret', process.env.CRON_SECRET!);
    expect(ok.body).toEqual({ reminded: 0 });
  });
});
