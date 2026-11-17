import type { SettingsRepository } from '../repositories/SettingsRepository';
import type { HoursInput } from '../validators/settings.schemas';

export class SettingsService {
  constructor(private readonly settings: SettingsRepository) {}

  get() {
    return this.settings.get();
  }

  updateHours({ openingHours, slotStepMin }: HoursInput) {
    // keep the days in Sunday to Saturday order however the client sent them
    const sorted = [...openingHours].sort((a, b) => a.day - b.day);
    return this.settings.update({
      openingHours: sorted,
      ...(slotStepMin ? { slotStepMin } : {}),
    });
  }
}
