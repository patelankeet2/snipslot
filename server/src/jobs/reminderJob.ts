import cron from 'node-cron';
import type { BookingRepository } from '../repositories/BookingRepository';
import type { SettingsRepository } from '../repositories/SettingsRepository';
import { bookingEvents } from '../events/bookingEvents';
import { toEventData } from '../events/toEventData';
import { logger } from '../utils/logger';

// Finds bookings starting within the reminder window (60 minutes by default)
// and announces a reminder for each one. Safe to run as often as we like:
// each booking is marked as reminded at the moment it is picked up.
export class ReminderJob {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly settings: SettingsRepository,
  ) {}

  async run(now = new Date()) {
    const { reminderLeadMin } = await this.settings.get();
    const until = new Date(now.getTime() + reminderLeadMin * 60 * 1000);

    let reminded = 0;
    // claim them one at a time until there are none left in the window
    let booking = await this.bookings.claimDueReminder(now, until);
    while (booking) {
      bookingEvents.emit('booking.reminder', toEventData(booking, 'system'));
      reminded++;
      booking = await this.bookings.claimDueReminder(now, until);
    }

    if (reminded > 0) logger.info(`Reminder job sent ${reminded} reminder(s)`);
    return { reminded };
  }

  // Local / single server: run every 5 minutes inside this process.
  // On Render's free plan the server sleeps, so production calls POST /api/jobs/reminders instead.
  schedule() {
    cron.schedule('*/5 * * * *', () => {
      this.run().catch((err) =>
        logger.error('Reminder job failed', {
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    });
    logger.info('Reminder job scheduled every 5 minutes');
  }
}
