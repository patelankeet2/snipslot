import { PageHeader } from '../../components/PageHeader';

export default function ServicesPage() {
  return (
    <section className="page">
      <PageHeader
        title="Services"
        subtitle="What customers can book, how long it takes and the price."
      />
      <div className="empty-state">Service management is on its way.</div>
    </section>
  );
}
