import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';

export default function BookPage() {
  return (
    <section className="page">
      <PageHeader title="Book an appointment" subtitle="Pick a service, a barber and a time." />
      <EmptyState
        icon="scissors"
        title="Booking opens soon"
        text="The shop is setting up its services. Check back shortly."
      />
    </section>
  );
}
