import { Schema, Types, model, type HydratedDocument } from 'mongoose';
import { jsonOptions } from './schemaOptions';

export const BOOKING_STATUSES = ['booked', 'cancelled', 'completed', 'no_show'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface IBooking {
  customer: Types.ObjectId;
  barber: Types.ObjectId;
  service: Types.ObjectId;
  start: Date;
  end: Date;
  status: BookingStatus;
  // copied at booking time so later price changes do not rewrite history
  priceAtBooking: number;
  notes?: string;
  reminderSent: boolean;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    barber: { type: Schema.Types.ObjectId, ref: 'Barber', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: 'booked' },
    priceAtBooking: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true, maxlength: 300 },
    reminderSent: { type: Boolean, default: false },
    cancelledAt: { type: Date },
  },
  { timestamps: true, toJSON: jsonOptions },
);

// Last line of defence against double booking: only one active booking
// can start at the same time for the same barber. Cancelled ones are ignored.
bookingSchema.index(
  { barber: 1, start: 1 },
  { unique: true, partialFilterExpression: { status: 'booked' } },
);

// overlap checks and the owner's day view
bookingSchema.index({ barber: 1, start: 1, end: 1 });
// "my bookings" for a customer
bookingSchema.index({ customer: 1, start: -1 });
// reminder job looks for upcoming bookings that have not been reminded yet
bookingSchema.index({ status: 1, reminderSent: 1, start: 1 });

export type BookingDoc = HydratedDocument<IBooking>;
export const BookingModel = model<IBooking>('Booking', bookingSchema);
