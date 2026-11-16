import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';

export default function MyBookingsPage() {
  return (
    <section className="page">
      <PageHeader title="My bookings" subtitle="Your upcoming and past appointments." />
      <EmptyState
        icon="calendar"
        title="No bookings yet"
        text="When you book a cut it will show up here."
        action={
          <Link className="btn btn-primary" to="/book">
            Book now
          </Link>
        }
      />
    </section>
  );
}
