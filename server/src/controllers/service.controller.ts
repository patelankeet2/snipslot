import type { Request, Response } from 'express';
import { catalogService } from '../container';

// Controllers stay thin: read the (already validated) request,
// call the service, send the response.

export async function listServices(req: Request, res: Response) {
  // only the owner can ask for archived services as well
  const includeInactive = req.query.all === 'true' && req.user?.role === 'owner';
  const services = await catalogService.list(includeInactive);
  res.json({ services });
}

export async function getService(req: Request, res: Response) {
  const service = await catalogService.get(String(req.params.id));
  res.json({ service });
}

export async function createService(req: Request, res: Response) {
  const service = await catalogService.create(req.body);
  res.status(201).json({ service });
}

export async function updateService(req: Request, res: Response) {
  const service = await catalogService.update(String(req.params.id), req.body);
  res.json({ service });
}

export async function deleteService(req: Request, res: Response) {
  const result = await catalogService.remove(String(req.params.id));
  res.json(result);
}
