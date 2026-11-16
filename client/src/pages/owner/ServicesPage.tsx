import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';

export default function ServicesPage() {
  return (
    <section className="page">
      <PageHeader
        title="Services"
        subtitle="What customers can book, how long it takes and the price."
      />
      <EmptyState icon="scissors" title="Services" text="Service management is coming next." />
    </section>
  );
}
