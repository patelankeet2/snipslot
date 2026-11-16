import { useEffect, useState } from 'react';

type ApiStatus = 'checking' | 'online' | 'offline';

// Temporary landing page for the setup stage.
// It pings the API so we can confirm the dev proxy is wired up.
export default function App() {
  const [status, setStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => setStatus(res.ok ? 'online' : 'offline'))
      .catch(() => setStatus('offline'));
  }, []);

  return (
    <main className="setup">
      <img src="/logo.svg" alt="" width={72} height={72} />
      <h1>SnipSlot</h1>
      <p>Barber and salon booking, right from your phone.</p>
      <p className={`pill pill-${status}`}>API: {status}</p>
    </main>
  );
}
