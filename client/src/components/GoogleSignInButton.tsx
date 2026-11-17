import { useEffect, useRef, useState } from 'react';
import { config } from '../config';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise: Promise<void> | null = null;

// Load Google's script once, no matter how many times the button mounts
function loadGoogleScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null; // allow a retry later
      reject(new Error('Could not load Google sign-in. Check your connection.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface Props {
  onCredential: (credential: string) => void;
}

export function GoogleSignInButton({ onCredential }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [error, setError] = useState<string | null>(null);

  // keep the latest callback without re-initialising Google every render
  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: (response) => callbackRef.current(response.credential),
          ux_mode: 'popup',
          auto_select: false,
          // browser native sign in (FedCM) where supported, avoids popup messaging issues
          use_fedcm_for_button: true,
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'filled_blue',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 280,
        });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="google-button">
      <div ref={containerRef} />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
