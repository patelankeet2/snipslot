import { useEffect, useState } from 'react';
import { disablePush, enablePush, getPushStatus, type PushStatus } from '../push/pushClient';
import { pushApi } from '../api/push';
import { errorMessage } from '../api/client';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { Icon } from './Icon';

const HINTS: Partial<Record<PushStatus, string>> = {
  unsupported: 'This browser does not support push notifications.',
  'needs-install':
    'On iPhone, add SnipSlot to your home screen first (Share > Add to Home Screen), then turn this on from the app.',
  denied:
    'Notifications are blocked for this site. Allow them in your browser settings (the lock icon in the address bar).',
};

// Profile card: turn push on or off for this device, and (owner) send a test
export function NotificationsCard() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushStatus()
      .then(setStatus)
      .catch(() => setStatus('unsupported'));
  }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      const next = status === 'enabled' ? await disablePush() : await enablePush();
      setStatus(next);
      if (next === 'enabled') notify('Notifications are on for this device');
      if (next === 'disabled' && status === 'enabled') notify('Notifications turned off', 'info');
      if (next === 'denied') notify('Notifications were blocked', 'error');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    try {
      const { sent } = await pushApi.sendTest();
      notify(
        sent > 0 ? 'Test sent, check your notifications' : 'No subscribed devices found',
        'info',
      );
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!status) return null;
  const blocked = status === 'unsupported' || status === 'needs-install' || status === 'denied';
  const description =
    user?.role === 'owner'
      ? 'Get a notification when a customer books, moves or cancels.'
      : 'Get a reminder an hour before your appointment.';

  return (
    <div className="card notify-card">
      <div className="notify-row">
        <span className={`notify-icon${status === 'enabled' ? ' is-on' : ''}`}>
          <Icon name="bell" />
        </span>
        <div className="notify-text">
          <h2>Notifications</h2>
          <p className="muted">{blocked ? HINTS[status] : description}</p>
        </div>

        {!blocked && (
          <label className="switch">
            <input
              type="checkbox"
              checked={status === 'enabled'}
              disabled={busy}
              onChange={toggle}
              aria-label="Push notifications on this device"
            />
            <span className="switch-track" aria-hidden="true" />
          </label>
        )}
      </div>

      {user?.role === 'owner' && status === 'enabled' && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={sendTest} disabled={busy}>
          <Icon name="bell" size={16} /> Send a test notification
        </button>
      )}
    </div>
  );
}
