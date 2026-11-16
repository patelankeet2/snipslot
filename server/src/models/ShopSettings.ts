import { Schema, model, type HydratedDocument } from 'mongoose';
import { jsonOptions } from './schemaOptions';

export interface IOpeningHours {
  day: number; // 0 = Sunday
  open: string; // "09:00"
  close: string; // "17:30"
  closed: boolean;
}

export interface IShopSettings {
  key: string;
  shopName: string;
  timezone: string;
  slotStepMin: number;
  reminderLeadMin: number;
  openingHours: IOpeningHours[];
  updatedAt: Date;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const openingHoursSchema = new Schema<IOpeningHours>(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    open: { type: String, required: true, match: TIME },
    close: { type: String, required: true, match: TIME },
    closed: { type: Boolean, default: false },
  },
  { _id: false },
);

const shopSettingsSchema = new Schema<IShopSettings>(
  {
    // only one shop, so there is a single settings document with key "default"
    key: { type: String, required: true, unique: true, default: 'default' },
    shopName: { type: String, default: 'SnipSlot Barbers', maxlength: 60 },
    // all slot maths happens in the shop's local time, not the server's
    timezone: { type: String, default: 'Pacific/Auckland' },
    slotStepMin: { type: Number, default: 15, enum: [5, 10, 15, 20, 30] },
    reminderLeadMin: { type: Number, default: 60, min: 15, max: 1440 },
    openingHours: { type: [openingHoursSchema], default: [] },
  },
  { timestamps: true, toJSON: jsonOptions },
);

export type ShopSettingsDoc = HydratedDocument<IShopSettings>;
export const ShopSettingsModel = model<IShopSettings>('ShopSettings', shopSettingsSchema);
