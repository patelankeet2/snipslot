import type { Request, Response } from 'express';
import { settingsService } from '../container';

export async function getSettings(_req: Request, res: Response) {
  const settings = await settingsService.get();
  res.json({ settings });
}

export async function updateHours(req: Request, res: Response) {
  const settings = await settingsService.updateHours(req.body);
  res.json({ settings });
}
