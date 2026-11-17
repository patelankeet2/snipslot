import { bookingsApi, type Slot } from '../../api/bookings';
import { useLoader } from '../../hooks/useLoader';
import { formatTime, partOfDay } from '../../utils/format';
import { Spinner } from '../Spinner';

interface Props {
  serviceId: string;
  barberId: string;
  date: string;
  selected: string | null;
  onSelect: (slot: Slot) => void;
  excludeBookingId?: string;
}

// Free start times for the chosen day, grouped into morning / afternoon / evening
export function SlotGrid({
  serviceId,
  barberId,
  date,
  selected,
  onSelect,
  excludeBookingId,
}: Props) {
  const {
    data: slots,
    loading,
    error,
  } = useLoader(
    () => bookingsApi.slots({ serviceId, barberId, date, excludeBookingId }),
    [serviceId, barberId, date, excludeBookingId],
  );

  if (loading) return <Spinner label="Finding free times" />;
  if (error) return <p className="notice">{error}</p>;
  if (!slots || slots.length === 0) {
    return <p className="empty-inline">No free times on this day. Try another day.</p>;
  }

  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = partOfDay(slot.start);
    groups.set(key, [...(groups.get(key) ?? []), slot]);
  }

  return (
    <div className="slot-groups">
      {[...groups.entries()].map(([label, group]) => (
        <div key={label} className="slot-group">
          <h3 className="slot-group-title">{label}</h3>
          <div className="slot-grid" role="radiogroup" aria-label={`${label} times`}>
            {group.map((slot) => (
              <button
                key={slot.start}
                type="button"
                role="radio"
                aria-checked={selected === slot.start}
                className={`slot${selected === slot.start ? ' is-selected' : ''}`}
                onClick={() => onSelect(slot)}
              >
                {formatTime(slot.start)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
