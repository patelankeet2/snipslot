import type { Request, Response } from 'express';
import { bookingService } from '../container';

const actor = (req: Request) => ({ id: req.user!.id, role: req.user!.role });

export async function getSlots(req: Request, res: Response) {
  const { serviceId, barberId, date, excludeBookingId } = req.query as Record<string, string>;
  const { slots, timezone } = await bookingService.getFreeSlots(
    serviceId,
    barberId,
    date,
    excludeBookingId,
  );
  res.json({ date, timezone, slots });
}

export async function createBooking(req: Request, res: Response) {
  const booking = await bookingService.create(req.user!.id, req.body);
  res.status(201).json({ booking });
}

export async function myBookings(req: Request, res: Response) {
  const scope = req.query.scope === 'past' ? 'past' : 'upcoming';
  const bookings = await bookingService.listForCustomer(req.user!.id, scope);
  res.json({ bookings });
}

export async function getBooking(req: Request, res: Response) {
  const booking = await bookingService.getForActor(String(req.params.id), actor(req));
  res.json({ booking });
}

export async function rescheduleBooking(req: Request, res: Response) {
  const booking = await bookingService.reschedule(String(req.params.id), actor(req), req.body);
  res.json({ booking });
}

export async function cancelBooking(req: Request, res: Response) {
  const booking = await bookingService.cancel(String(req.params.id), actor(req));
  res.json({ booking });
}

export async function getSchedule(req: Request, res: Response) {
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;
  const schedule = await bookingService.getSchedule(date);
  res.json(schedule);
}

export async function updateBookingStatus(req: Request, res: Response) {
  const booking = await bookingService.updateStatus(String(req.params.id), req.body.status);
  res.json({ booking });
}
