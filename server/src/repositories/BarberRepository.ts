import { BaseRepository } from './BaseRepository';
import { BarberModel, type IBarber } from '../models/Barber';

export class BarberRepository extends BaseRepository<IBarber> {
  constructor() {
    super(BarberModel);
  }

  // same idea as services: rarely changes, fine to read from a secondary
  findActive() {
    return this.model.find({ active: true }).sort({ name: 1 }).read('secondaryPreferred');
  }

  findAll() {
    return this.model.find().sort({ active: -1, name: 1 });
  }
}
