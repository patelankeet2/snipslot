import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';

export default function BarbersPage() {
  return (
    <section className="page">
      <PageHeader title="Barbers and hours" subtitle="Who is working and when the shop is open." />
      <EmptyState icon="users" title="Barbers and hours" text="Barber management is coming next." />
    </section>
  );
}
