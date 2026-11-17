import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { Spinner } from '../../components/Spinner';
import { Icon } from '../../components/Icon';
import { scheduleApi } from '../../api/catalog';
import { errorMessage } from '../../api/client';
import { useLoader } from '../../hooks/useLoader';
import { useToast } from '../../hooks/useToast';
import { formatLongDate, formatPrice, formatTime, shiftDay, todayInShop } from '../../utils/format';
import type { Booking, BookingStatus } from '../../types';

const STATUS_LABEL: Record<BookingStatus, string> = {
  booked: 'Booked',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No-show',
};

export default function SchedulePage() {
  const today = todayInShop();
  const [date, setDate] = useState(today);
  const { notify } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data, setData, loading, error } = useLoader(() => scheduleApi.forDay(date), [date]);
  const bookings = data?.bookings ?? [];

  const counts = {
    total: bookings.filter((b) => b.status !== 'cancelled').length,
    done: bookings.filter((b) => b.status === 'completed').length,
    noShow: bookings.filter((b) => b.status === 'no_show').length,
  };

  const setStatus = async (booking: Booking, status: 'completed' | 'no_show') => {
    setUpdatingId(booking.id);
    try {
      const updated = await scheduleApi.setStatus(booking.id, status);
      setData((d) =>
        d ? { ...d, bookings: d.bookings.map((b) => (b.id === updated.id ? updated : b)) } : d,
      );
      notify(`${booking.customer.name} marked as ${STATUS_LABEL[status].toLowerCase()}`);
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="page">
      <PageHeader title="Schedule" subtitle="Appointments across all barbers for the day." />

      <div className="day-nav card">
        <button
          type="button"
          className="icon-btn"
          aria-label="Previous day"
          onClick={() => setDate((d) => shiftDay(d, -1))}
        >
          <Icon name="chevronLeft" />
        </button>

        <div className="day-nav-centre">
          <strong>{formatLongDate(date)}</strong>
          <input
            type="date"
            aria-label="Pick a date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="icon-btn"
          aria-label="Next day"
          onClick={() => setDate((d) => shiftDay(d, 1))}
        >
          <Icon name="chevronRight" />
        </button>

        {date !== today && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDate(today)}>
            Today
          </button>
        )}
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-value">{counts.total}</span>
          <span className="stat-label">Appointments</span>
        </div>
        <div className="stat">
          <span className="stat-value">{counts.done}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat">
          <span className="stat-value">{counts.noShow}</span>
          <span className="stat-label">No-shows</span>
        </div>
      </div>

      {loading && !data && <Spinner label="Loading the schedule" />}
      {error && <p className="notice">{error}</p>}

      {data && bookings.length === 0 && (
        <EmptyState
          icon="calendar"
          title="Nothing booked"
          text="No appointments on this day yet. New bookings appear here as customers make them."
        />
      )}

      {bookings.length > 0 && (
        <ol className="timeline">
          {bookings.map((b) => (
            <li key={b.id} className={`card booking-row status-${b.status}`}>
              <div className="booking-time">
                <strong>{formatTime(b.start)}</strong>
                <span className="muted">{formatTime(b.end)}</span>
              </div>

              <div className="booking-info">
                <div className="item-title">
                  <h2>{b.customer.name}</h2>
                  <span className={`badge status-badge-${b.status}`}>{STATUS_LABEL[b.status]}</span>
                </div>
                <p className="muted">
                  {b.service.name} with {b.barber.name} · {formatPrice(b.priceAtBooking)}
                </p>
                {b.notes && <p className="booking-notes">“{b.notes}”</p>}
              </div>

              {b.status === 'booked' && (
                <div className="item-actions">
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    disabled={updatingId === b.id}
                    onClick={() => setStatus(b, 'completed')}
                  >
                    <Icon name="check" size={16} /> Completed
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={updatingId === b.id}
                    onClick={() => setStatus(b, 'no_show')}
                  >
                    <Icon name="ban" size={16} /> No-show
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
