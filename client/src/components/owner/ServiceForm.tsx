import { useState, type FormEvent } from 'react';
import { FormField } from '../FormField';
import { ApiError, errorMessage } from '../../api/client';
import type { ServiceInput } from '../../api/catalog';
import type { Service } from '../../types';
import { serviceFormSchema, toFieldErrors, type FieldErrors } from '../../validation/schemas';

interface Props {
  initial?: Service;
  onSubmit: (input: ServiceInput) => Promise<void>;
  onCancel: () => void;
}

export function ServiceForm({ initial, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    durationMin: String(initial?.durationMin ?? 30),
    price: String(initial?.price ?? ''),
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof values) => (value: string) =>
    setValues((v) => ({ ...v, [field]: value }));

  // check one field when the user leaves it, so mistakes show early
  const validateField = (field: keyof typeof values) => {
    const result = serviceFormSchema.safeParse(values);
    const fieldErrors = result.success ? {} : toFieldErrors(result.error);
    setErrors((prev) => {
      const next = { ...prev };
      if (fieldErrors[field]) next[field] = fieldErrors[field];
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = serviceFormSchema.safeParse(values);
    if (!result.success) {
      setErrors(toFieldErrors(result.error));
      return;
    }

    setSaving(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      // show the server's field messages next to the right inputs
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
      <FormField id="service-name" label="Name" error={errors.name}>
        <input
          value={values.name}
          onChange={(e) => set('name')(e.target.value)}
          onBlur={() => validateField('name')}
          placeholder="eg Skin Fade"
          maxLength={60}
          autoFocus
        />
      </FormField>

      <FormField
        id="service-description"
        label="Description"
        hint="Optional. Shown to customers when they book."
        error={errors.description}
      >
        <textarea
          rows={3}
          value={values.description}
          onChange={(e) => set('description')(e.target.value)}
          onBlur={() => validateField('description')}
          maxLength={300}
        />
      </FormField>

      <div className="form-row">
        <FormField id="service-duration" label="Duration (minutes)" error={errors.durationMin}>
          <input
            type="number"
            inputMode="numeric"
            min={5}
            max={240}
            step={5}
            value={values.durationMin}
            onChange={(e) => set('durationMin')(e.target.value)}
            onBlur={() => validateField('durationMin')}
          />
        </FormField>

        <FormField id="service-price" label="Price (NZD)" error={errors.price}>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            value={values.price}
            onChange={(e) => set('price')(e.target.value)}
            onBlur={() => validateField('price')}
            placeholder="35"
          />
        </FormField>
      </div>

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : initial ? 'Save changes' : 'Add service'}
        </button>
      </div>
    </form>
  );
}
