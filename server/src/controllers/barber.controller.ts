import type { Request, Response } from 'express';
import { barberService } from '../container';

export async function listBarbers(req: Request, res: Response) {
  const includeInactive = req.query.all === 'true' && req.user?.role === 'owner';
  const barbers = await barberService.list(includeInactive);
  res.json({ barbers });
}

export async function getBarber(req: Request, res: Response) {
  const barber = await barberService.get(String(req.params.id));
  res.json({ barber });
}

export async function createBarber(req: Request, res: Response) {
  const barber = await barberService.create(req.body);
  res.status(201).json({ barber });
}

export async function updateBarber(req: Request, res: Response) {
  const barber = await barberService.update(String(req.params.id), req.body);
  res.json({ barber });
}

export async function deleteBarber(req: Request, res: Response) {
  const result = await barberService.remove(String(req.params.id));
  res.json(result);
}
