import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useOutbox } from '../hooks/useOutbox';
import { Icon } from './Icon';

// Thin bar under the header: offline status and how many changes are waiting
export function OfflineBanner() {
  const online = useOnlineStatus();
  const pending = useOutbox().length;

  if (online && pending === 0) return null;

  return (
    <div className={`offline-banner${online ? ' is-syncing' : ''}`} role="status">
      <Icon name={online ? 'clock' : 'wifiOff'} size={18} />
      {online ? (
        <span>
          Syncing {pending} change{pending > 1 ? 's' : ''}...
        </span>
      ) : (
        <span>
          You are offline. Showing saved data
          {pending > 0 && `, ${pending} change${pending > 1 ? 's' : ''} waiting to sync`}.
        </span>
      )}
    </div>
  );
}
