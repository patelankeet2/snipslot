import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { errorMessage } from '../api/client';

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const online = useOnlineStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (user) return <Navigate to={from} replace />;

  const handleCredential = async (credential: string) => {
    setError(null);
    setBusy(true);
    try {
      await signIn(credential);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <section className="login-card">
        <img src="/logo.svg" alt="" width={72} height={72} />
        <h1>SnipSlot</h1>
        <p className="muted">Book your next cut in a few taps, and manage it from your phone.</p>

        {online ? (
          <GoogleSignInButton onCredential={handleCredential} />
        ) : (
          <p className="notice">You are offline. Connect to the internet to sign in.</p>
        )}

        {busy && <p className="muted">Signing you in...</p>}
        {error && <p className="form-error">{error}</p>}

        <p className="fine-print">
          We only use your name, email and profile photo from Google to manage your bookings.
        </p>
      </section>
    </main>
  );
}
