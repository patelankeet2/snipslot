import { Schema, model, type HydratedDocument } from 'mongoose';
import { jsonOptions } from './schemaOptions';

export interface IBarber {
  name: string;
  bio?: string;
  photoUrl?: string;
  // 0 = Sunday ... 6 = Saturday, same as JavaScript's getDay()
  workingDays: number[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const barberSchema = new Schema<IBarber>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    bio: { type: String, trim: true, maxlength: 300 },
    photoUrl: { type: String },
    workingDays: {
      type: [{ type: Number, min: 0, max: 6 }],
      default: [1, 2, 3, 4, 5],
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: jsonOptions },
);

export type BarberDoc = HydratedDocument<IBarber>;
export const BarberModel = model<IBarber>('Barber', barberSchema);
