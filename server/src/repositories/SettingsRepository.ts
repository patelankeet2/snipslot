import { ShopSettingsModel, type IOpeningHours, type IShopSettings } from '../models/ShopSettings';

// Mon to Fri 9 to 6, Sat 9 to 4, closed Sunday
export const DEFAULT_OPENING_HOURS: IOpeningHours[] = [
  { day: 0, open: '09:00', close: '17:00', closed: true },
  { day: 1, open: '09:00', close: '18:00', closed: false },
  { day: 2, open: '09:00', close: '18:00', closed: false },
  { day: 3, open: '09:00', close: '18:00', closed: false },
  { day: 4, open: '09:00', close: '18:00', closed: false },
  { day: 5, open: '09:00', close: '18:00', closed: false },
  { day: 6, open: '09:00', close: '16:00', closed: false },
];

export class SettingsRepository {
  private readonly model = ShopSettingsModel;

  // There is only ever one settings document, created the first time it is needed
  async get() {
    return this.model.findOneAndUpdate(
      { key: 'default' },
      { $setOnInsert: { key: 'default', openingHours: DEFAULT_OPENING_HOURS } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  }

  async update(changes: Partial<Omit<IShopSettings, 'key' | 'updatedAt'>>) {
    await this.get(); // make sure it exists first
    return this.model.findOneAndUpdate(
      { key: 'default' },
      { $set: changes },
      { returnDocument: 'after', runValidators: true },
    );
  }
}
