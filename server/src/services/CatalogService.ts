import type { ServiceRepository } from '../repositories/ServiceRepository';
import type { BookingRepository } from '../repositories/BookingRepository';
import type { MediaService } from './MediaService';
import type { ServiceInput } from '../validators/service.schemas';
import { AppError } from '../utils/AppError';

// Business rules for the shop's service menu (haircuts, beard trims...)
export class CatalogService {
  constructor(
    private readonly services: ServiceRepository,
    private readonly bookings: BookingRepository,
    private readonly media: MediaService,
  ) {}

  // customers only see what can be booked, the owner can ask for everything
  list(includeInactive: boolean) {
    return includeInactive ? this.services.findAll() : this.services.findActive();
  }

  async get(id: string) {
    const service = await this.services.findById(id);
    if (!service) throw AppError.notFound('Service not found');
    return service;
  }

  create(input: ServiceInput) {
    this.assertOwnPhoto(input.photoUrl);
    return this.services.create(input);
  }

  async update(id: string, changes: Partial<ServiceInput>) {
    this.assertOwnPhoto(changes.photoUrl);
    const before = await this.get(id);

    const service = await this.services.updateById(id, changes);
    if (!service) throw AppError.notFound('Service not found');

    // the photo was swapped or removed, so the old file is no longer needed
    if (changes.photoUrl !== undefined && before.photoUrl !== changes.photoUrl) {
      void this.media.deletePhoto(before.photoUrl);
    }
    return service;
  }

  // A service that already has bookings is archived instead of deleted,
  // otherwise those bookings would point at nothing.
  async remove(id: string) {
    const service = await this.get(id);
    const used = await this.bookings.count({ service: service._id });

    if (used > 0) {
      service.active = false;
      await service.save();
      return { archived: true };
    }

    await this.services.deleteById(id);
    void this.media.deletePhoto(service.photoUrl);
    return { archived: false };
  }

  // only accept photos that were uploaded through our own upload endpoint
  private assertOwnPhoto(url?: string) {
    if (url && !this.media.isOurPhoto(url)) {
      throw AppError.badRequest('Upload the photo through the app first');
    }
  }
}
