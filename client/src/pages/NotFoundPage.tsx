import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="page narrow center">
      <h1>Page not found</h1>
      <p className="muted">That page does not exist or has moved.</p>
      <Link className="btn btn-primary" to="/">
        Go home
      </Link>
    </main>
  );
}
