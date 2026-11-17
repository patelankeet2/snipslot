import { Types } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import { BookingModel, type IBooking } from '../models/Booking';

export class BookingRepository extends BaseRepository<IBooking> {
  constructor() {
    super(BookingModel);
  }

  // Two time ranges overlap when each one starts before the other ends.
  // excludeId lets a reschedule ignore the booking that is being moved.
  findOverlapping(barberId: string, start: Date, end: Date, excludeId?: string) {
    return this.model.findOne({
      barber: new Types.ObjectId(barberId),
      status: 'booked',
      start: { $lt: end },
      end: { $gt: start },
      ...(excludeId ? { _id: { $ne: new Types.ObjectId(excludeId) } } : {}),
    });
  }

  // upcoming = still booked and not finished yet, past = everything else
  findForCustomer(customerId: string, scope: 'upcoming' | 'past', now = new Date()) {
    const customer = new Types.ObjectId(customerId);
    const filter =
      scope === 'upcoming'
        ? { customer, status: 'booked' as const, end: { $gte: now } }
        : { customer, $or: [{ status: { $ne: 'booked' as const } }, { end: { $lt: now } }] };

    return this.model
      .find(filter)
      .sort({ start: scope === 'upcoming' ? 1 : -1 })
      .limit(50)
      .populate('barber', 'name')
      .populate('service', 'name durationMin');
  }

  // every booking that starts inside the window, with names filled in for display
  findForDay(from: Date, to: Date) {
    return this.model
      .find({ start: { $gte: from, $lt: to } })
      .sort({ start: 1 })
      .populate('customer', 'name email picture')
      .populate('barber', 'name')
      .populate('service', 'name durationMin');
  }

  // active bookings for a barber inside a window, used to work out free slots
  findBookedBetween(barberId: string, from: Date, to: Date) {
    return this.model
      .find({
        barber: new Types.ObjectId(barberId),
        status: 'booked',
        start: { $lt: to },
        end: { $gt: from },
      })
      .sort({ start: 1 });
  }
}
