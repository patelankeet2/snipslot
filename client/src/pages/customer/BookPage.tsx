import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { Spinner } from '../../components/Spinner';
import { Icon } from '../../components/Icon';
import { DateStrip } from '../../components/booking/DateStrip';
import { SlotGrid } from '../../components/booking/SlotGrid';
import { barbersApi, servicesApi, settingsApi } from '../../api/catalog';
import { bookingsApi, type MyBooking, type Slot } from '../../api/bookings';
import { ApiError, errorMessage } from '../../api/client';
import { useLoader } from '../../hooks/useLoader';
import { useToast } from '../../hooks/useToast';
import {
  formatDuration,
  formatLongDate,
  formatPrice,
  formatShortDate,
  formatTime,
  formatWorkingDays,
} from '../../utils/format';
import type { Barber, Service } from '../../types';

const STEPS = ['Service', 'Barber', 'Time', 'Confirm'];

export default function BookPage() {
  // everything the flow needs, loaded once
  const catalog = useLoader(() =>
    Promise.all([servicesApi.list(), barbersApi.list(), settingsApi.get()]),
  );
  const { notify } = useToast();

  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<MyBooking | null>(null);

  if (catalog.loading && !catalog.data) return <Spinner label="Loading the menu" />;
  if (catalog.error && !catalog.data) return <p className="notice">{catalog.error}</p>;
  const [services, barbers, settings] = catalog.data!;

  if (services.length === 0 || barbers.length === 0) {
    return (
      <section className="page">
        <PageHeader title="Book an appointment" />
        <EmptyState
          icon="scissors"
          title="Booking opens soon"
          text="The shop is still setting things up."
        />
      </section>
    );
  }

  const pickService = (s: Service) => {
    setService(s);
    setSlot(null);
    setStep(1);
  };

  const pickBarber = (b: Barber) => {
    setBarber(b);
    setDate(null);
    setSlot(null);
    setStep(2);
  };

  const book = async () => {
    if (!service || !barber || !slot) return;
    setSubmitting(true);
    setError(null);
    try {
      const booking = await bookingsApi.create({
        serviceId: service.id,
        barberId: barber.id,
        start: slot.start,
        notes: notes.trim() || undefined,
      });
      setConfirmed(booking);
      notify('Booking confirmed');
    } catch (err) {
      setError(errorMessage(err));
      // the slot was taken while they were deciding: send them back to pick again
      if (err instanceof ApiError && err.status === 409) {
        setSlot(null);
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    setConfirmed(null);
    setService(null);
    setBarber(null);
    setDate(null);
    setSlot(null);
    setNotes('');
    setStep(0);
  };

  // ---------- success screen ----------
  if (confirmed) {
    return (
      <section className="page narrow">
        <div className="card success-card">
          <span className="success-icon">
            <Icon name="check" size={32} />
          </span>
          <h1>You are booked in</h1>
          <p className="muted">
            {confirmed.service.name} with {confirmed.barber.name}
          </p>
          <p className="success-when">
            {formatShortDate(confirmed.start)} at {formatTime(confirmed.start)}
          </p>
          <div className="form-actions center">
            <button type="button" className="btn btn-ghost" onClick={startOver}>
              Book another
            </button>
            <Link to="/bookings" className="btn btn-primary">
              View my bookings
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <PageHeader title="Book an appointment" subtitle="Pick a service, a barber and a time." />

      <ol className="stepper" aria-label="Booking steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={i === step ? 'is-current' : i < step ? 'is-done' : ''}
            aria-current={i === step ? 'step' : undefined}
          >
            <button type="button" disabled={i > step} onClick={() => setStep(i)}>
              <span className="step-dot">{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
              <span className="step-label">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* step 1: service */}
      {step === 0 && (
        <ul className="choice-list">
          {services.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={`choice${service?.id === s.id ? ' is-selected' : ''}`}
                onClick={() => pickService(s)}
              >
                <span className="choice-main">
                  <strong>{s.name}</strong>
                  {s.description && <span className="muted">{s.description}</span>}
                </span>
                <span className="choice-side">
                  <span className="price">{formatPrice(s.price)}</span>
                  <span className="muted small">{formatDuration(s.durationMin)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* step 2: barber */}
      {step === 1 && (
        <ul className="choice-list">
          {barbers.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className={`choice${barber?.id === b.id ? ' is-selected' : ''}`}
                onClick={() => pickBarber(b)}
              >
                <span className="avatar avatar-md avatar-fallback" aria-hidden="true">
                  {b.name.charAt(0)}
                </span>
                <span className="choice-main">
                  <strong>{b.name}</strong>
                  {b.bio && <span className="muted">{b.bio}</span>}
                  <span className="muted small">Works {formatWorkingDays(b.workingDays)}</span>
                </span>
                <Icon name="chevronRight" className="choice-arrow" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* step 3: day and time */}
      {step === 2 && service && barber && (
        <div className="card">
          <h2 className="section-title">Choose a day</h2>
          <DateStrip
            value={date}
            onChange={(d) => {
              setDate(d);
              setSlot(null);
            }}
            openingHours={settings.openingHours}
            workingDays={barber.workingDays}
          />

          {error && <p className="notice">{error}</p>}

          {date ? (
            <>
              <h2 className="section-title">Free times on {formatLongDate(date)}</h2>
              <SlotGrid
                serviceId={service.id}
                barberId={barber.id}
                date={date}
                selected={slot?.start ?? null}
                onSelect={(s) => {
                  setSlot(s);
                  setError(null);
                }}
              />
            </>
          ) : (
            <p className="empty-inline">Pick a day to see the free times.</p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!slot}
              onClick={() => setStep(3)}
            >
              Continue <Icon name="arrowRight" size={18} />
            </button>
          </div>
        </div>
      )}

      {/* step 4: confirm */}
      {step === 3 && service && barber && slot && date && (
        <div className="card summary">
          <h2 className="section-title">Check your booking</h2>
          <dl className="summary-list">
            <div>
              <dt>Service</dt>
              <dd>
                {service.name}{' '}
                <span className="muted">({formatDuration(service.durationMin)})</span>
              </dd>
            </div>
            <div>
              <dt>Barber</dt>
              <dd>{barber.name}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>
                {formatLongDate(date)}, {formatTime(slot.start)} to {formatTime(slot.end)}
              </dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd className="price">{formatPrice(service.price)}</dd>
            </div>
          </dl>

          <div className="field">
            <label htmlFor="booking-notes">Notes for your barber (optional)</label>
            <textarea
              id="booking-notes"
              rows={2}
              maxLength={300}
              value={notes}
              placeholder="eg Number 2 on the sides, keep the length on top"
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setStep(2)}
              disabled={submitting}
            >
              Change time
            </button>
            <button type="button" className="btn btn-primary" onClick={book} disabled={submitting}>
              {submitting ? 'Booking...' : 'Confirm booking'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
