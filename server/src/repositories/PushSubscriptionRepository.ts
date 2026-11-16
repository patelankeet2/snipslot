import { Types } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import { PushSubscriptionModel, type IPushSubscription } from '../models/PushSubscription';

export class PushSubscriptionRepository extends BaseRepository<IPushSubscription> {
  constructor() {
    super(PushSubscriptionModel);
  }

  findByUsers(userIds: string[]) {
    return this.model.find({ user: { $in: userIds.map((id) => new Types.ObjectId(id)) } });
  }

  deleteByEndpoint(endpoint: string) {
    return this.model.deleteOne({ endpoint });
  }
}
