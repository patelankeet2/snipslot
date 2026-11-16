// Just the parts of Google Identity Services that we use
interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  ux_mode?: 'popup' | 'redirect';
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonOptions {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'small' | 'medium' | 'large';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  width?: number;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize(config: GoogleIdConfig): void;
        renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
        disableAutoSelect(): void;
      };
    };
  };
}
