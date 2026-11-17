import type { BookingRepository } from '../repositories/BookingRepository';
import type { SettingsRepository } from '../repositories/SettingsRepository';
import { AppError } from '../utils/AppError';
import { dayRange, todayIn } from '../utils/time';

export class BookingService {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly settings: SettingsRepository,
  ) {}

  // Everything happening in the shop on one day, for the owner's schedule
  async getSchedule(date?: string) {
    const { timezone } = await this.settings.get();
    const day = date ?? todayIn(timezone);
    const { start, end } = dayRange(day, timezone);

    const bookings = await this.bookings.findForDay(start, end);
    return { date: day, timezone, bookings };
  }

  // Owner marks how an appointment went
  async updateStatus(id: string, status: 'completed' | 'no_show') {
    const booking = await this.bookings.findById(id);
    if (!booking) throw AppError.notFound('Booking not found');

    if (booking.status !== 'booked') {
      throw AppError.conflict(`This booking is already ${booking.status.replace('_', ' ')}`);
    }

    // you cannot mark tomorrow's customer as a no show today
    const { timezone } = await this.settings.get();
    const { end: endOfToday } = dayRange(todayIn(timezone), timezone);
    if (booking.start >= endOfToday) {
      throw AppError.badRequest('You can only update bookings from today or earlier');
    }

    booking.status = status;
    await booking.save();
    return booking.populate(['customer', 'barber', 'service']);
  }
}
