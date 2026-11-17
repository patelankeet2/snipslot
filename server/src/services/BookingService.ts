import { DateTime } from 'luxon';
import { Types } from 'mongoose';
import type { BookingRepository } from '../repositories/BookingRepository';
import type { SettingsRepository } from '../repositories/SettingsRepository';
import type { ServiceRepository } from '../repositories/ServiceRepository';
import type { BarberRepository } from '../repositories/BarberRepository';
import type { BookingDoc } from '../models/Booking';
import type { Role } from '../models/User';
import type { BookingCreateInput, BookingRescheduleInput } from '../validators/booking.schemas';
import { AppError } from '../utils/AppError';
import { dayRange, todayIn } from '../utils/time';
import { computeSlots } from '../utils/slots';

interface Actor {
  id: string;
  role: Role;
}

const isDuplicateKey = (err: unknown) =>
  typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;

export class BookingService {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly settings: SettingsRepository,
    private readonly services: ServiceRepository,
    private readonly barbers: BarberRepository,
  ) {}

  // ---------- slots ----------

  async getFreeSlots(serviceId: string, barberId: string, date: string, excludeBookingId?: string) {
    const [settings, service, barber] = await Promise.all([
      this.settings.get(),
      this.services.findById(serviceId),
      this.barbers.findById(barberId),
    ]);
    if (!service?.active) throw AppError.notFound('Service not found');
    if (!barber?.active) throw AppError.notFound('Barber not found');

    const { start, end } = dayRange(date, settings.timezone);
    const booked = await this.bookings.findBookedBetween(barberId, start, end);
    const busy = booked.filter((b) => b.id !== excludeBookingId);

    const slots = computeSlots({
      date,
      timezone: settings.timezone,
      openingHours: settings.openingHours,
      slotStepMin: settings.slotStepMin,
      workingDays: barber.workingDays,
      durationMin: service.durationMin,
      busy,
    });

    return { date, timezone: settings.timezone, slots, service, barber };
  }

  // The requested start must be one of the free slots we would have offered.
  // This one check covers opening hours, working days, step size, the past and clashes.
  private async claimSlot(
    serviceId: string,
    barberId: string,
    startIso: string,
    excludeId?: string,
  ) {
    const { timezone } = await this.settings.get();
    const start = DateTime.fromISO(startIso).setZone(timezone);
    const date = start.toISODate()!;

    const { slots, service, barber } = await this.getFreeSlots(
      serviceId,
      barberId,
      date,
      excludeId,
    );
    const match = slots.find((s) => +new Date(s.start) === start.toMillis());
    if (!match) {
      throw AppError.conflict('That time is not available any more. Please pick another slot.');
    }
    return { service, barber, start: new Date(match.start), end: new Date(match.end) };
  }

  // ---------- customer actions ----------

  async create(customerId: string, input: BookingCreateInput) {
    const { service, barber, start, end } = await this.claimSlot(
      input.serviceId,
      input.barberId,
      input.start,
    );

    try {
      const booking = await this.bookings.create({
        customer: new Types.ObjectId(customerId),
        barber: barber._id,
        service: service._id,
        start,
        end,
        priceAtBooking: service.price,
        notes: input.notes,
      });
      return this.withDetails(booking);
    } catch (err) {
      // two people pressed "book" for the same slot at the same moment;
      // the unique index lets only one of them through
      if (isDuplicateKey(err))
        throw AppError.conflict('Someone just booked that time. Please pick another.');
      throw err;
    }
  }

  listForCustomer(customerId: string, scope: 'upcoming' | 'past') {
    return this.bookings.findForCustomer(customerId, scope);
  }

  async getForActor(id: string, actor: Actor) {
    const booking = await this.findOwned(id, actor);
    return this.withDetails(booking);
  }

  async reschedule(id: string, actor: Actor, input: BookingRescheduleInput) {
    const booking = await this.findOwned(id, actor);
    this.assertChangeable(booking);

    const barberId = input.barberId ?? booking.barber.toString();
    const { barber, start, end } = await this.claimSlot(
      booking.service.toString(),
      barberId,
      input.start,
      booking.id,
    );

    // a new time means a new reminder
    booking.set({ barber: barber._id, start, end, reminderSent: false });
    try {
      await booking.save();
    } catch (err) {
      if (isDuplicateKey(err))
        throw AppError.conflict('Someone just booked that time. Please pick another.');
      throw err;
    }
    return this.withDetails(booking);
  }

  // Cancelling keeps the record (status "cancelled") so the history stays complete
  async cancel(id: string, actor: Actor) {
    const booking = await this.findOwned(id, actor);
    this.assertChangeable(booking);

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();
    return this.withDetails(booking);
  }

  // ---------- owner actions ----------

  async getSchedule(date?: string) {
    const { timezone } = await this.settings.get();
    const day = date ?? todayIn(timezone);
    const { start, end } = dayRange(day, timezone);

    const bookings = await this.bookings.findForDay(start, end);
    return { date: day, timezone, bookings };
  }

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
    return this.withDetails(booking);
  }

  // ---------- helpers ----------

  // Customers can only touch their own bookings, the owner can see all of them
  private async findOwned(id: string, actor: Actor) {
    const booking = await this.bookings.findById(id);
    if (!booking) throw AppError.notFound('Booking not found');
    if (actor.role !== 'owner' && booking.customer.toString() !== actor.id) {
      throw AppError.forbidden('This booking belongs to someone else');
    }
    return booking;
  }

  private assertChangeable(booking: BookingDoc) {
    if (booking.status !== 'booked') {
      throw AppError.conflict(`This booking is already ${booking.status.replace('_', ' ')}`);
    }
    if (booking.start <= new Date()) {
      throw AppError.badRequest('This appointment has already started');
    }
  }

  private withDetails(booking: BookingDoc) {
    return booking.populate([
      { path: 'customer', select: 'name email picture' },
      { path: 'barber', select: 'name' },
      { path: 'service', select: 'name durationMin' },
    ]);
  }
}
