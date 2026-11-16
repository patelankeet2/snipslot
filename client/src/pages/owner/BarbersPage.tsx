import { PageHeader } from '../../components/PageHeader';

export default function BarbersPage() {
  return (
    <section className="page">
      <PageHeader title="Barbers and hours" subtitle="Who is working and when the shop is open." />
      <div className="empty-state">Barber management is on its way.</div>
    </section>
  );
}
