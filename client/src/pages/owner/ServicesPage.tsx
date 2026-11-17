import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { Spinner } from '../../components/Spinner';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Icon } from '../../components/Icon';
import { ServiceForm } from '../../components/owner/ServiceForm';
import { servicesApi, type ServiceInput } from '../../api/catalog';
import { errorMessage } from '../../api/client';
import { useLoader } from '../../hooks/useLoader';
import { useToast } from '../../hooks/useToast';
import { formatDuration, formatPrice } from '../../utils/format';
import type { Service } from '../../types';

// editing === null means the form is closed, 'new' means adding
type Editing = Service | 'new' | null;

export default function ServicesPage() {
  const {
    data: services,
    setData,
    loading,
    error,
    reload,
  } = useLoader(() => servicesApi.list(true));
  const { notify } = useToast();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);

  const handleSave = async (input: ServiceInput) => {
    if (editing === 'new') {
      const created = await servicesApi.create(input);
      setData((list) => [...(list ?? []), created].sort((a, b) => a.name.localeCompare(b.name)));
      notify(`${created.name} added`);
    } else if (editing) {
      const updated = await servicesApi.update(editing.id, input);
      setData((list) => list?.map((s) => (s.id === updated.id ? updated : s)) ?? null);
      notify('Changes saved');
    }
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const { archived } = await servicesApi.remove(deleting.id);
      notify(
        archived
          ? `${deleting.name} has past bookings, so it was archived instead`
          : `${deleting.name} deleted`,
        archived ? 'info' : 'success',
      );
      reload();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const restore = async (service: Service) => {
    try {
      const updated = await servicesApi.update(service.id, { active: true });
      setData((list) => list?.map((s) => (s.id === updated.id ? updated : s)) ?? null);
      notify(`${service.name} is bookable again`);
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <section className="page">
      <PageHeader
        title="Services"
        subtitle="What customers can book, how long it takes and the price."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            <Icon name="plus" size={18} /> Add service
          </button>
        }
      />

      {loading && !services && <Spinner label="Loading services" />}
      {error && <p className="notice">{error}</p>}

      {services && services.length === 0 && (
        <EmptyState
          icon="scissors"
          title="No services yet"
          text="Add your first service so customers can start booking."
        />
      )}

      {services && services.length > 0 && (
        <ul className="card-grid">
          {services.map((service) => (
            <li
              key={service.id}
              className={`card item-card${service.active ? '' : ' is-archived'}`}
            >
              <div className="item-main">
                <div className="item-title">
                  <h2>{service.name}</h2>
                  {!service.active && <span className="badge badge-muted">Archived</span>}
                </div>
                {service.description && <p className="muted">{service.description}</p>}
                <div className="item-meta">
                  <span className="chip">
                    <Icon name="clock" size={16} /> {formatDuration(service.durationMin)}
                  </span>
                  <span className="price">{formatPrice(service.price)}</span>
                </div>
              </div>

              <div className="item-actions">
                {service.active ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditing(service)}
                    >
                      <Icon name="edit" size={16} /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleting(service)}
                    >
                      <Icon name="trash" size={16} /> Delete
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => restore(service)}
                  >
                    Restore
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add a service' : 'Edit service'}
        onClose={() => setEditing(null)}
      >
        <ServiceForm
          initial={editing && editing !== 'new' ? editing : undefined}
          onSubmit={handleSave}
          onCancel={() => setEditing(null)}
        />
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this service?"
        message={`"${deleting?.name}" will no longer be bookable. If it already has bookings it will be archived instead of deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </section>
  );
}
