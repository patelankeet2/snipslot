import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { Spinner } from '../../components/Spinner';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Icon } from '../../components/Icon';
import { PersonPhoto } from '../../components/PersonPhoto';
import { BarberForm } from '../../components/owner/BarberForm';
import { HoursEditor } from '../../components/owner/HoursEditor';
import { barbersApi, settingsApi, type BarberInput } from '../../api/catalog';
import { errorMessage } from '../../api/client';
import { useLoader } from '../../hooks/useLoader';
import { useToast } from '../../hooks/useToast';
import { formatWorkingDays } from '../../utils/format';
import type { Barber } from '../../types';

type Editing = Barber | 'new' | null;

export default function BarbersPage() {
  const barbers = useLoader(() => barbersApi.list(true));
  const settings = useLoader(() => settingsApi.get());
  const { notify } = useToast();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Barber | null>(null);

  const handleSave = async (input: BarberInput) => {
    if (editing === 'new') {
      const created = await barbersApi.create(input);
      barbers.setData((list) => [...(list ?? []), created]);
      notify(`${created.name} added to the team`);
    } else if (editing) {
      const updated = await barbersApi.update(editing.id, input);
      barbers.setData((list) => list?.map((b) => (b.id === updated.id ? updated : b)) ?? null);
      notify('Changes saved');
    }
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const { archived } = await barbersApi.remove(deleting.id);
      notify(
        archived
          ? `${deleting.name} has past bookings, so they were archived`
          : `${deleting.name} removed`,
        archived ? 'info' : 'success',
      );
      barbers.reload();
    } catch (err) {
      // eg they still have upcoming bookings (409 from the API)
      notify(errorMessage(err), 'error');
    }
  };

  const restore = async (barber: Barber) => {
    try {
      const updated = await barbersApi.update(barber.id, { active: true });
      barbers.setData((list) => list?.map((b) => (b.id === updated.id ? updated : b)) ?? null);
      notify(`${barber.name} is taking bookings again`);
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <section className="page">
      <PageHeader
        title="Barbers and hours"
        subtitle="Who is working and when the shop is open."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            <Icon name="plus" size={18} /> Add barber
          </button>
        }
      />

      {barbers.loading && !barbers.data && <Spinner label="Loading barbers" />}
      {barbers.error && <p className="notice">{barbers.error}</p>}

      {barbers.data && barbers.data.length === 0 && (
        <EmptyState
          icon="users"
          title="No barbers yet"
          text="Add the people who cut hair in your shop."
        />
      )}

      {barbers.data && barbers.data.length > 0 && (
        <ul className="card-grid">
          {barbers.data.map((barber) => (
            <li key={barber.id} className={`card item-card${barber.active ? '' : ' is-archived'}`}>
              <div className="item-main barber-main">
                <PersonPhoto name={barber.name} photoUrl={barber.photoUrl} />
                <div>
                  <div className="item-title">
                    <h2>{barber.name}</h2>
                    {!barber.active && <span className="badge badge-muted">Archived</span>}
                  </div>
                  {barber.bio && <p className="muted">{barber.bio}</p>}
                  <p className="item-meta">
                    <span className="chip">
                      <Icon name="calendar" size={16} /> {formatWorkingDays(barber.workingDays)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="item-actions">
                {barber.active ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditing(barber)}
                    >
                      <Icon name="edit" size={16} /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleting(barber)}
                    >
                      <Icon name="trash" size={16} /> Remove
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => restore(barber)}
                  >
                    Restore
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {settings.data && <HoursEditor initial={settings.data.openingHours} />}
      {settings.error && <p className="notice">{settings.error}</p>}

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add a barber' : 'Edit barber'}
        onClose={() => setEditing(null)}
      >
        <BarberForm
          initial={editing && editing !== 'new' ? editing : undefined}
          onSubmit={handleSave}
          onCancel={() => setEditing(null)}
        />
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Remove this barber?"
        message={`${deleting?.name} will stop appearing for new bookings. This is blocked while they still have upcoming appointments.`}
        confirmLabel="Remove"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </section>
  );
}
