import { Schema, model, type HydratedDocument } from 'mongoose';
import { jsonOptions } from './schemaOptions';

export interface IService {
  name: string;
  description?: string;
  durationMin: number;
  price: number;
  photoUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300 },
    // slots move in 5 minute steps so durations have to line up with that
    durationMin: {
      type: Number,
      required: true,
      min: 5,
      max: 240,
      validate: {
        validator: (v: number) => v % 5 === 0,
        message: 'Duration must be in 5 minute steps',
      },
    },
    price: { type: Number, required: true, min: 0, max: 1000 },
    photoUrl: { type: String },
    // soft delete: old bookings still point at this service
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: jsonOptions },
);

serviceSchema.index({ active: 1, name: 1 });

export type ServiceDoc = HydratedDocument<IService>;
export const ServiceModel = model<IService>('Service', serviceSchema);
