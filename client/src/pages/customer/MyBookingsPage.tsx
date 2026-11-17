import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { Spinner } from '../../components/Spinner';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Icon } from '../../components/Icon';
import { RescheduleForm } from '../../components/booking/RescheduleForm';
import { bookingsApi, type MyBooking } from '../../api/bookings';
import { barbersApi, settingsApi } from '../../api/catalog';
import { errorMessage } from '../../api/client';
import { useLoader } from '../../hooks/useLoader';
import { useToast } from '../../hooks/useToast';
import { useOutbox } from '../../hooks/useOutbox';
import { DATA_SYNCED } from '../../components/SyncManager';
import {
  dateParts,
  formatDuration,
  formatPrice,
  formatShortDate,
  formatTime,
} from '../../utils/format';
import type { BookingStatus } from '../../types';

type Tab = 'upcoming' | 'past';

const STATUS_LABEL: Record<BookingStatus, string> = {
  booked: 'Booked',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'Missed',
};

export default function MyBookingsPage() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const bookings = useLoader(() => bookingsApi.mine(tab), [tab]);
  // needed for the reschedule picker (working days and opening hours)
  const extras = useLoader(() => Promise.all([barbersApi.list(), settingsApi.get()]));
  const { notify } = useToast();

  const [moving, setMoving] = useState<MyBooking | null>(null);
  const [cancelling, setCancelling] = useState<MyBooking | null>(null);

  // changes made offline that have not reached the server yet, by booking id
  const outbox = useOutbox();
  const pendingFor = new Map(outbox.map((item) => [item.bookingId, item]));

  // once queued changes have synced, fetch the real state from the server
  const { reload } = bookings;
  useEffect(() => {
    window.addEventListener(DATA_SYNCED, reload);
    return () => window.removeEventListener(DATA_SYNCED, reload);
  }, [reload]);

  const reschedule = async (start: string) => {
    if (!moving) return;
    const result = await bookingsApi.reschedule(moving, start);
    if (result.queued) {
      notify('You are offline. The new time will be saved when you reconnect.', 'info');
    } else {
      const updated = result.booking;
      bookings.setData(
        (list) =>
          list
            ?.map((b) => (b.id === updated.id ? updated : b))
            .sort((a, b) => a.start.localeCompare(b.start)) ?? null,
      );
      notify(`Moved to ${formatShortDate(updated.start)} at ${formatTime(updated.start)}`);
    }
    setMoving(null);
  };

  const cancel = async () => {
    if (!cancelling) return;
    try {
      const result = await bookingsApi.cancel(cancelling);
      if (result.queued) {
        notify('You are offline. The cancellation will be sent when you reconnect.', 'info');
      } else {
        bookings.setData((list) => list?.filter((b) => b.id !== cancelling.id) ?? null);
        notify('Booking cancelled');
      }
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const movingBarber = moving && extras.data?.[0].find((b) => b.id === moving.barber.id);

  return (
    <section className="page">
      <PageHeader
        title="My bookings"
        subtitle="Your upcoming and past appointments."
        action={
          <Link to="/book" className="btn btn-primary">
            <Icon name="plus" size={18} /> New booking
          </Link>
        }
      />

      <div className="tabs" role="tablist" aria-label="Bookings">
        {(['upcoming', 'past'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'is-active' : ''}
            onClick={() => setTab(t)}
          >
            {t === 'upcoming' ? 'Upcoming' : 'Past'}
          </button>
        ))}
      </div>

      {bookings.loading && !bookings.data && <Spinner label="Loading your bookings" />}
      {bookings.error && <p className="notice">{bookings.error}</p>}

      {bookings.data && bookings.data.length === 0 && (
        <EmptyState
          icon="calendar"
          title={tab === 'upcoming' ? 'No upcoming bookings' : 'Nothing here yet'}
          text={
            tab === 'upcoming'
              ? 'When you book a cut it will show up here.'
              : 'Past and cancelled appointments will show up here.'
          }
          action={
            tab === 'upcoming' && (
              <Link className="btn btn-primary" to="/book">
                Book now
              </Link>
            )
          }
        />
      )}

      {bookings.data && bookings.data.length > 0 && (
        <ul className="booking-list">
          {bookings.data.map((b) => (
            <li
              key={b.id}
              className={`card my-booking status-${b.status}${pendingFor.has(b.id) ? ' is-pending' : ''}`}
            >
              <div className="date-badge" aria-hidden="true">
                <span>{dateParts(b.start).weekday}</span>
                <strong>{dateParts(b.start).day}</strong>
                <span>{dateParts(b.start).month}</span>
              </div>

              <div className="booking-info">
                <div className="item-title">
                  <h2>{b.service.name}</h2>
                  <span className={`badge status-badge-${b.status}`}>{STATUS_LABEL[b.status]}</span>
                </div>
                <p className="muted">
                  {formatShortDate(b.start)}, {formatTime(b.start)} to {formatTime(b.end)}
                </p>
                <p className="muted">
                  with {b.barber.name} · {formatDuration(b.service.durationMin)} ·{' '}
                  {formatPrice(b.priceAtBooking)}
                </p>
                {b.notes && <p className="booking-notes">“{b.notes}”</p>}
                {pendingFor.has(b.id) && (
                  <p className="pending-note">
                    <Icon name="clock" size={14} /> Waiting to sync:{' '}
                    {pendingFor.get(b.id)!.kind === 'cancel' ? 'cancellation' : 'new time'}
                  </p>
                )}
              </div>

              {tab === 'upcoming' && b.status === 'booked' && !pendingFor.has(b.id) && (
                <div className="item-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setMoving(b)}
                  >
                    <Icon name="calendar" size={16} /> Reschedule
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setCancelling(b)}
                  >
                    <Icon name="close" size={16} /> Cancel
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={moving !== null} title="Pick a new time" onClose={() => setMoving(null)}>
        {moving && movingBarber && extras.data ? (
          <RescheduleForm
            booking={moving}
            barber={movingBarber}
            openingHours={extras.data[1].openingHours}
            onSubmit={reschedule}
            onCancel={() => setMoving(null)}
          />
        ) : (
          <Spinner />
        )}
      </Modal>

      <ConfirmDialog
        open={cancelling !== null}
        title="Cancel this booking?"
        message={
          cancelling
            ? `${cancelling.service.name} on ${formatShortDate(cancelling.start)} at ${formatTime(cancelling.start)} will be cancelled and the time freed up for someone else.`
            : ''
        }
        confirmLabel="Cancel booking"
        danger
        onConfirm={cancel}
        onClose={() => setCancelling(null)}
      />
    </section>
  );
}
