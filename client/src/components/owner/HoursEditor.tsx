import { useState } from 'react';
import { settingsApi } from '../../api/catalog';
import { errorMessage } from '../../api/client';
import { useToast } from '../../hooks/useToast';
import { DAY_NAMES } from '../../utils/format';
import { dayHoursSchema } from '../../validation/schemas';
import type { OpeningHours } from '../../types';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface Props {
  initial: OpeningHours[];
}

// Seven rows, one per day: open or closed, plus opening and closing times
export function HoursEditor({ initial }: Props) {
  const [hours, setHours] = useState<OpeningHours[]>(initial);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  const update = (day: number, changes: Partial<OpeningHours>) =>
    setHours((list) => list.map((h) => (h.day === day ? { ...h, ...changes } : h)));

  const save = async () => {
    // check every row and collect a message per day that has a problem
    const problems: Record<number, string> = {};
    for (const h of hours) {
      const result = dayHoursSchema.safeParse(h);
      if (!result.success) problems[h.day] = result.error.issues[0].message;
    }
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSaving(true);
    try {
      const settings = await settingsApi.updateHours(hours);
      setHours(settings.openingHours);
      notify('Opening hours saved');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Opening hours</h2>
          <p className="muted">Customers can only book inside these times.</p>
        </div>
      </div>

      <ul className="hours-list">
        {WEEK_ORDER.map((day) => {
          const h = hours.find((x) => x.day === day);
          if (!h) return null;
          return (
            <li key={day} className={`hours-row${h.closed ? ' is-closed' : ''}`}>
              <span className="hours-day">{DAY_NAMES[day]}</span>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={!h.closed}
                  onChange={(e) => update(day, { closed: !e.target.checked })}
                />
                <span className="switch-track" aria-hidden="true" />
                <span className="switch-label">{h.closed ? 'Closed' : 'Open'}</span>
              </label>

              <div className="hours-times">
                <input
                  type="time"
                  aria-label={`${DAY_NAMES[day]} opening time`}
                  value={h.open}
                  step={900}
                  disabled={h.closed}
                  onChange={(e) => update(day, { open: e.target.value })}
                />
                <span aria-hidden="true">to</span>
                <input
                  type="time"
                  aria-label={`${DAY_NAMES[day]} closing time`}
                  value={h.close}
                  step={900}
                  disabled={h.closed}
                  onChange={(e) => update(day, { close: e.target.value })}
                />
              </div>

              {errors[day] && <p className="field-message hours-error">{errors[day]}</p>}
            </li>
          );
        })}
      </ul>

      <div className="form-actions">
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save hours'}
        </button>
      </div>
    </div>
  );
}
