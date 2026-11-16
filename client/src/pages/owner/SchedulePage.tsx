import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';

export default function SchedulePage() {
  return (
    <section className="page">
      <PageHeader title="Schedule" subtitle="Today's appointments across all barbers." />
      <EmptyState
        icon="calendar"
        title="No appointments today"
        text="New bookings will appear here as customers make them."
      />
    </section>
  );
}
