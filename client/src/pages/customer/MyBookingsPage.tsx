import { PageHeader } from '../../components/PageHeader';

export default function MyBookingsPage() {
  return (
    <section className="page">
      <PageHeader title="My bookings" subtitle="Your upcoming and past appointments." />
      <div className="empty-state">You have no bookings yet.</div>
    </section>
  );
}
