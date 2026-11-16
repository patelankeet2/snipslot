import { PageHeader } from '../../components/PageHeader';

export default function SchedulePage() {
  return (
    <section className="page">
      <PageHeader title="Schedule" subtitle="Today's appointments across all barbers." />
      <div className="empty-state">No appointments yet.</div>
    </section>
  );
}
