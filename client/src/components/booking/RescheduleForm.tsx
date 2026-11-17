import { useState } from 'react';
import { DateStrip } from './DateStrip';
import { SlotGrid } from './SlotGrid';
import { formatLongDate, formatShortDate, formatTime } from '../../utils/format';
import { errorMessage } from '../../api/client';
import type { Slot, MyBooking } from '../../api/bookings';
import type { Barber, OpeningHours } from '../../types';

interface Props {
  booking: MyBooking;
  barber: Barber;
  openingHours: OpeningHours[];
  onSubmit: (start: string) => Promise<void>;
  onCancel: () => void;
}

// Same day and time picker as booking, but the current booking does not
// block its own slot (excludeBookingId)
export function RescheduleForm({ booking, barber, openingHours, onSubmit, onCancel }: Props) {
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!slot) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(slot.start);
    } catch (err) {
      setError(errorMessage(err));
      setSlot(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form">
      <p className="muted">
        Currently {formatShortDate(booking.start)} at {formatTime(booking.start)} with {barber.name}
        .
      </p>

      <DateStrip
        value={date}
        onChange={(d) => {
          setDate(d);
          setSlot(null);
        }}
        openingHours={openingHours}
        workingDays={barber.workingDays}
      />

      {date && (
        <>
          <h3 className="section-title">Free times on {formatLongDate(date)}</h3>
          <SlotGrid
            serviceId={booking.service.id}
            barberId={barber.id}
            date={date}
            excludeBookingId={booking.id}
            selected={slot?.start ?? null}
            onSelect={setSlot}
          />
        </>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          Keep current time
        </button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={!slot || saving}>
          {saving ? 'Moving...' : slot ? `Move to ${formatTime(slot.start)}` : 'Pick a new time'}
        </button>
      </div>
    </div>
  );
}
