import type { BarberRepository } from '../repositories/BarberRepository';
import type { BookingRepository } from '../repositories/BookingRepository';
import type { BarberInput } from '../validators/barber.schemas';
import { AppError } from '../utils/AppError';

export class BarberService {
  constructor(
    private readonly barbers: BarberRepository,
    private readonly bookings: BookingRepository,
  ) {}

  list(includeInactive: boolean) {
    return includeInactive ? this.barbers.findAll() : this.barbers.findActive();
  }

  async get(id: string) {
    const barber = await this.barbers.findById(id);
    if (!barber) throw AppError.notFound('Barber not found');
    return barber;
  }

  create(input: BarberInput) {
    return this.barbers.create(input);
  }

  async update(id: string, changes: Partial<BarberInput>) {
    const barber = await this.barbers.updateById(id, changes);
    if (!barber) throw AppError.notFound('Barber not found');
    return barber;
  }

  // Do not leave customers with a booking for a barber who has gone
  async remove(id: string) {
    const barber = await this.get(id);
    const upcoming = await this.bookings.count({
      barber: barber._id,
      status: 'booked',
      start: { $gte: new Date() },
    });
    if (upcoming > 0) {
      throw AppError.conflict(
        `${barber.name} still has ${upcoming} upcoming booking(s). Move or cancel them first.`,
      );
    }

    const history = await this.bookings.count({ barber: barber._id });
    if (history > 0) {
      barber.active = false;
      await barber.save();
      return { archived: true };
    }

    await this.barbers.deleteById(id);
    return { archived: false };
  }
}
