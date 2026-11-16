import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

export default function NotFoundPage() {
  return (
    <main className="page narrow standalone">
      <EmptyState
        icon="scissors"
        title="Page not found"
        text="That page does not exist or has moved."
        action={
          <Link className="btn btn-primary" to="/">
            Go home
          </Link>
        }
      />
    </main>
  );
}
