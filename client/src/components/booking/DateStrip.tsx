import { useMemo } from 'react';
import { DAY_SHORT, shiftDay, todayInShop, weekdayOf } from '../../utils/format';
import type { OpeningHours } from '../../types';

interface Props {
  value: string | null;
  onChange: (day: string) => void;
  openingHours: OpeningHours[];
  workingDays: number[];
  days?: number;
}

// Horizontal row of the next two weeks. Days the shop is closed or the
// barber is off are shown but disabled, so people understand why.
export function DateStrip({ value, onChange, openingHours, workingDays, days = 14 }: Props) {
  const list = useMemo(() => {
    const today = todayInShop();
    return Array.from({ length: days }, (_, i) => {
      const day = shiftDay(today, i);
      const weekday = weekdayOf(day);
      const hours = openingHours.find((h) => h.day === weekday);
      const available = Boolean(hours && !hours.closed && workingDays.includes(weekday));
      return { day, weekday, available, isToday: i === 0 };
    });
  }, [days, openingHours, workingDays]);

  return (
    <div className="date-strip" role="radiogroup" aria-label="Choose a day">
      {list.map(({ day, weekday, available, isToday }) => (
        <button
          key={day}
          type="button"
          role="radio"
          aria-checked={value === day}
          className={`date-chip${value === day ? ' is-selected' : ''}`}
          disabled={!available}
          onClick={() => onChange(day)}
          title={available ? undefined : 'Not available on this day'}
        >
          <span className="date-chip-dow">{isToday ? 'Today' : DAY_SHORT[weekday]}</span>
          <span className="date-chip-day">{Number(day.slice(8))}</span>
        </button>
      ))}
    </div>
  );
}
