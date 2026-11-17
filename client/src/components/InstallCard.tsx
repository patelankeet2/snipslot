import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useToast } from '../hooks/useToast';
import { Icon } from './Icon';

// "Add SnipSlot to your home screen" card for the profile page
export function InstallCard() {
  const { canInstall, installed, showIosHint, install } = useInstallPrompt();
  const { notify } = useToast();

  if (installed) {
    return (
      <div className="card install-card">
        <span className="install-icon is-done">
          <Icon name="check" />
        </span>
        <div>
          <h2>App installed</h2>
          <p className="muted">SnipSlot is on your home screen and works offline.</p>
        </div>
      </div>
    );
  }

  if (!canInstall && !showIosHint) return null;

  return (
    <div className="card install-card">
      <img src="/pwa-192x192.png" alt="" width={48} height={48} className="install-app-icon" />
      <div className="install-text">
        <h2>Install the app</h2>
        {showIosHint ? (
          <p className="muted">
            Tap the Share button in Safari, then <strong>Add to Home Screen</strong>.
          </p>
        ) : (
          <p className="muted">Open SnipSlot from your home screen, even with no signal.</p>
        )}
      </div>
      {canInstall && (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={async () => {
            if (await install()) notify('SnipSlot installed');
          }}
        >
          Install
        </button>
      )}
    </div>
  );
}
