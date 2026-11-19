import type { BookingDoc } from '../models/Booking';
import type { BookingEventData } from './bookingEvents';

type Named = { _id?: unknown; id?: string; name?: string };

// Turn a populated booking into the plain data the event listeners need
export function toEventData(
  booking: BookingDoc,
  actorRole: BookingEventData['actorRole'],
): BookingEventData {
  const customer = booking.customer as unknown as Named;
  const service = booking.service as unknown as Named;
  const barber = booking.barber as unknown as Named;

  return {
    bookingId: booking.id,
    customerId: String(customer?._id ?? customer),
    customerName: customer?.name ?? 'A customer',
    serviceName: service?.name ?? 'an appointment',
    barberName: barber?.name ?? 'your barber',
    start: booking.start,
    actorRole,
  };
}
