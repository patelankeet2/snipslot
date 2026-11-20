import { UserModel, type Role } from '../../src/models/User';
import { ServiceModel } from '../../src/models/Service';
import { BarberModel } from '../../src/models/Barber';
import { SettingsRepository } from '../../src/repositories/SettingsRepository';
import { signSessionToken } from '../../src/utils/jwt';

let counter = 0;

// Create a user and a valid session token for them, like after a Google sign in
export async function createUser(role: Role = 'customer', name = 'Test Customer') {
  counter++;
  const user = await UserModel.create({
    googleId: `google-${counter}`,
    email: `${role}${counter}@test.nz`,
    name,
    role,
  });
  const token = signSessionToken({ sub: user.id, role });
  return { user, token, auth: { Authorization: `Bearer ${token}` } };
}

// The same starter data the seed script creates, enough to book against
export async function seedShop() {
  await new SettingsRepository().get(); // default hours: Mon to Fri 9 to 6, Sat 9 to 4
  const [fade, trim] = await ServiceModel.create([
    { name: 'Skin Fade', durationMin: 45, price: 45 },
    { name: 'Beard Trim', durationMin: 20, price: 20 },
  ]);
  const [jordan, mia] = await BarberModel.create([
    { name: 'Jordan', workingDays: [1, 2, 3, 4, 5] },
    { name: 'Mia', workingDays: [2, 3, 4, 5, 6] },
  ]);
  return { fade, trim, jordan, mia };
}

// A Tuesday far enough ahead that no slot is ever "in the past"
export const FUTURE_TUESDAY = '2030-01-08';
