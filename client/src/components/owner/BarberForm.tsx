import { useState, type FormEvent } from 'react';
import { FormField } from '../FormField';
import { PhotoField } from './PhotoField';
import { ApiError, errorMessage } from '../../api/client';
import type { BarberInput } from '../../api/catalog';
import type { Barber } from '../../types';
import { DAY_SHORT } from '../../utils/format';
import { barberFormSchema, toFieldErrors, type FieldErrors } from '../../validation/schemas';

interface Props {
  initial?: Barber;
  onSubmit: (input: BarberInput) => Promise<void>;
  onCancel: () => void;
}

// Monday first, which is how people in NZ read a week
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function BarberForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [workingDays, setWorkingDays] = useState<number[]>(initial?.workingDays ?? [1, 2, 3, 4, 5]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? '');
  const [uploading, setUploading] = useState(false);

  const toggleDay = (day: number) =>
    setWorkingDays((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort(),
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = barberFormSchema.safeParse({ name, bio, workingDays });
    if (!result.success) {
      setErrors(toFieldErrors(result.error));
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      await onSubmit({ ...result.data, photoUrl });
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <FormField id="barber-name" label="Name" error={errors.name}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="eg Jordan"
          maxLength={60}
          autoFocus
        />
      </FormField>

      <FormField
        id="barber-bio"
        label="Short bio"
        hint="Optional, eg what they specialise in."
        error={errors.bio}
      >
        <textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} />
      </FormField>

      <fieldset className={`field${errors.workingDays ? ' field-error' : ''}`}>
        <legend>Working days</legend>
        <div className="day-picker">
          {WEEK_ORDER.map((day) => (
            <label key={day} className={`day-chip${workingDays.includes(day) ? ' is-on' : ''}`}>
              <input
                type="checkbox"
                checked={workingDays.includes(day)}
                onChange={() => toggleDay(day)}
              />
              {DAY_SHORT[day]}
            </label>
          ))}
        </div>
        {errors.workingDays && <p className="field-message">{errors.workingDays}</p>}
      </fieldset>

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <PhotoField
        value={photoUrl}
        onChange={setPhotoUrl}
        folder="barbers"
        label="Photo (optional)"
        onBusyChange={setUploading}
      />

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
          {saving ? 'Saving...' : initial ? 'Save changes' : 'Add barber'}
        </button>
      </div>
    </form>
  );
}
