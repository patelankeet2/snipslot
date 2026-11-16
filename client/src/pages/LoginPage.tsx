import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { Icon, type IconName } from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { errorMessage } from '../api/client';

// three short steps so a first time visitor knows what to expect
const STEPS: { icon: IconName; text: string }[] = [
  { icon: 'scissors', text: 'Pick a service' },
  { icon: 'users', text: 'Choose your barber' },
  { icon: 'clock', text: 'Grab a free slot' },
];

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
      <section className="login-card" aria-labelledby="login-title">
        <img src="/logo.svg" alt="" width={68} height={68} className="login-logo" />
        <h1 id="login-title">SnipSlot</h1>
        <p className="login-tagline">Book your next cut in a few taps.</p>

        <ol className="steps">
          {STEPS.map((step, i) => (
            <li key={step.text}>
              <span className="step-icon">
                <Icon name={step.icon} size={18} />
              </span>
              <span>
                <span className="step-number">{i + 1}.</span> {step.text}
              </span>
            </li>
          ))}
        </ol>

        {online ? (
          <GoogleSignInButton onCredential={handleCredential} />
        ) : (
          <p className="notice" role="status">
            <Icon name="wifiOff" size={18} /> You are offline. Connect to the internet to sign in.
          </p>
        )}

        <div aria-live="polite">
          {busy && <p className="muted">Signing you in...</p>}
          {error && <p className="form-error">{error}</p>}
        </div>

        <p className="fine-print">
          <Icon name="lock" size={14} /> We only use your name, email and profile photo from Google
          to manage your bookings.
        </p>
      </section>
    </main>
  );
}
