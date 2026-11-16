import { PageHeader } from '../../components/PageHeader';

export default function BookPage() {
  return (
    <section className="page">
      <PageHeader title="Book an appointment" subtitle="Pick a service, a barber and a time." />
      <div className="empty-state">Booking will be available here soon.</div>
    </section>
  );
}
