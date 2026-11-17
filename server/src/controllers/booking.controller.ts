import type { Request, Response } from 'express';
import { bookingService } from '../container';

export async function getSchedule(req: Request, res: Response) {
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;
  const schedule = await bookingService.getSchedule(date);
  res.json(schedule);
}

export async function updateBookingStatus(req: Request, res: Response) {
  const booking = await bookingService.updateStatus(String(req.params.id), req.body.status);
  res.json({ booking });
}
