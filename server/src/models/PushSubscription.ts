import { Schema, Types, model, type HydratedDocument } from 'mongoose';
import { jsonOptions } from './schemaOptions';

export interface IPushSubscription {
  user: Types.ObjectId;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // the browser push service URL, unique per device and browser
    endpoint: { type: String, required: true, unique: true },
    // public keys used to encrypt the payload for this device
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, maxlength: 300 },
  },
  { timestamps: true, toJSON: jsonOptions },
);

export type PushSubscriptionDoc = HydratedDocument<IPushSubscription>;
export const PushSubscriptionModel = model<IPushSubscription>(
  'PushSubscription',
  pushSubscriptionSchema,
);
