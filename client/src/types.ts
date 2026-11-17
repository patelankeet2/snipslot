export type Role = 'customer' | 'owner';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: Role;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  durationMin: number;
  price: number;
  photoUrl?: string;
  active: boolean;
}

export interface Barber {
  id: string;
  name: string;
  bio?: string;
  photoUrl?: string;
  workingDays: number[]; // 0 = Sunday
  active: boolean;
}

export interface OpeningHours {
  day: number;
  open: string;
  close: string;
  closed: boolean;
}

export interface ShopSettings {
  shopName: string;
  timezone: string;
  slotStepMin: number;
  reminderLeadMin: number;
  openingHours: OpeningHours[];
}

export type BookingStatus = 'booked' | 'cancelled' | 'completed' | 'no_show';

// bookings come back with the related records filled in
export interface Booking {
  id: string;
  customer: Pick<User, 'id' | 'name' | 'email' | 'picture'>;
  barber: Pick<Barber, 'id' | 'name'>;
  service: Pick<Service, 'id' | 'name' | 'durationMin'>;
  start: string;
  end: string;
  status: BookingStatus;
  priceAtBooking: number;
  notes?: string;
}
