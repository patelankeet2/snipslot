import { Types } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import { PushSubscriptionModel, type IPushSubscription } from '../models/PushSubscription';
import type { PushSubscriptionInput } from '../validators/push.schemas';

export class PushSubscriptionRepository extends BaseRepository<IPushSubscription> {
  constructor() {
    super(PushSubscriptionModel);
  }

  // the endpoint identifies the device, so subscribing twice updates instead of duplicating
  upsertByEndpoint(userId: string, sub: PushSubscriptionInput, userAgent?: string) {
    return this.model.findOneAndUpdate(
      { endpoint: sub.endpoint },
      { user: new Types.ObjectId(userId), endpoint: sub.endpoint, keys: sub.keys, userAgent },
      { upsert: true, returnDocument: 'after', runValidators: true },
    );
  }

  findByUsers(userIds: string[]) {
    return this.model.find({ user: { $in: userIds.map((id) => new Types.ObjectId(id)) } });
  }

  // users can only remove their own devices
  deleteForUser(userId: string, endpoint: string) {
    return this.model.deleteOne({ user: new Types.ObjectId(userId), endpoint });
  }

  deleteByEndpoint(endpoint: string) {
    return this.model.deleteOne({ endpoint });
  }
}
