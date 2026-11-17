import { env } from './config/env';
import { UserRepository } from './repositories/UserRepository';
import { ServiceRepository } from './repositories/ServiceRepository';
import { BarberRepository } from './repositories/BarberRepository';
import { SettingsRepository } from './repositories/SettingsRepository';
import { BookingRepository } from './repositories/BookingRepository';
import { GoogleTokenVerifier } from './services/GoogleTokenVerifier';
import { AuthService } from './services/AuthService';
import { CatalogService } from './services/CatalogService';
import { BarberService } from './services/BarberService';
import { SettingsService } from './services/SettingsService';
import { BookingService } from './services/BookingService';

// Composition root: every service gets its dependencies here, in one place.
// Controllers import from this file instead of creating things themselves.
const userRepository = new UserRepository();
const serviceRepository = new ServiceRepository();
const barberRepository = new BarberRepository();
const settingsRepository = new SettingsRepository();
const bookingRepository = new BookingRepository();

export const authService = new AuthService(
  userRepository,
  new GoogleTokenVerifier(env.GOOGLE_CLIENT_ID),
  env.ownerEmails,
);
export const catalogService = new CatalogService(serviceRepository, bookingRepository);
export const barberService = new BarberService(barberRepository, bookingRepository);
export const settingsService = new SettingsService(settingsRepository);
export const bookingService = new BookingService(
  bookingRepository,
  settingsRepository,
  serviceRepository,
  barberRepository,
);
