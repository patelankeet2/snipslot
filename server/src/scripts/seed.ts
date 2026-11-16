import { database } from '../config/db';
import { logger } from '../utils/logger';
import { ServiceModel } from '../models/Service';
import { BarberModel } from '../models/Barber';
import { BookingModel } from '../models/Booking';
import { UserModel } from '../models/User';
import { PushSubscriptionModel } from '../models/PushSubscription';
import { SettingsRepository } from '../repositories/SettingsRepository';

// Starter data so the app is usable straight away.
// Safe to run more than once: it only adds things when the collection is empty.
async function seed() {
  await database.connect();

  await new SettingsRepository().get();
  logger.info('Shop settings ready');

  if ((await ServiceModel.countDocuments()) === 0) {
    await ServiceModel.insertMany([
      {
        name: 'Classic Cut',
        description: 'Scissor and clipper cut, finished with a style.',
        durationMin: 30,
        price: 35,
      },
      {
        name: 'Skin Fade',
        description: 'Fade down to the skin with a sharp line up.',
        durationMin: 45,
        price: 45,
      },
      {
        name: 'Beard Trim',
        description: 'Shape, line and hot towel finish.',
        durationMin: 20,
        price: 20,
      },
      {
        name: 'Cut and Beard',
        description: 'Any cut plus a full beard tidy.',
        durationMin: 60,
        price: 60,
      },
      { name: 'Kids Cut', description: 'For under 12s.', durationMin: 20, price: 22 },
    ]);
    logger.info('Added starter services');
  }

  if ((await BarberModel.countDocuments()) === 0) {
    await BarberModel.insertMany([
      { name: 'Jordan', bio: 'Fades and modern styles.', workingDays: [1, 2, 3, 4, 5] },
      { name: 'Mia', bio: 'Scissor work and beard shaping.', workingDays: [2, 3, 4, 5, 6] },
    ]);
    logger.info('Added starter barbers');
  }

  // make sure the indexes (including the double booking guard) exist in Atlas
  await Promise.all([
    ServiceModel.syncIndexes(),
    BarberModel.syncIndexes(),
    BookingModel.syncIndexes(),
    UserModel.syncIndexes(),
    PushSubscriptionModel.syncIndexes(),
  ]);
  logger.info('Indexes synced');

  await database.disconnect();
}

seed().catch((err) => {
  logger.error('Seeding failed', { message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
