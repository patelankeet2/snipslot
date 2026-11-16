import { Schema, model, type HydratedDocument } from 'mongoose';
import { jsonOptions } from './schemaOptions';

export const ROLES = ['customer', 'owner'] as const;
export type Role = (typeof ROLES)[number];

export interface IUser {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  role: Role;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    // "sub" claim from the Google ID token, stable even if the email changes
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    picture: { type: String },
    role: { type: String, enum: ROLES, default: 'customer' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, toJSON: jsonOptions },
);

export type UserDoc = HydratedDocument<IUser>;
export const UserModel = model<IUser>('User', userSchema);
