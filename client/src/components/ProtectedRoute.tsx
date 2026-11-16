import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from './Spinner';
import type { Role } from '../types';

interface Props {
  roles?: Role[];
}

// Guards a group of routes. Without roles it only needs a signed in user.
// This is for the UI only, the API checks the role again on every request.
export function ProtectedRoute({ roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your session" />;

  if (!user) {
    // remember where they were going so we can send them back after sign in
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <section className="page narrow center">
        <h1>No access</h1>
        <p className="muted">This page is only for the {roles.join(' or ')}.</p>
        <Link className="btn btn-primary" to="/">
          Back to home
        </Link>
      </section>
    );
  }

  return <Outlet />;
}
