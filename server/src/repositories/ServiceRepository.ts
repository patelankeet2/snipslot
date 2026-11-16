import { BaseRepository } from './BaseRepository';
import { ServiceModel, type IService } from '../models/Service';

export class ServiceRepository extends BaseRepository<IService> {
  constructor() {
    super(ServiceModel);
  }

  // The menu is read far more than it changes, so these reads may go to a
  // secondary node in the replica set and take load off the primary.
  findActive() {
    return this.model.find({ active: true }).sort({ name: 1 }).read('secondaryPreferred');
  }

  findAll() {
    return this.model.find().sort({ active: -1, name: 1 });
  }
}
