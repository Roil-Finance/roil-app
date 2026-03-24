/**
 * Google OAuth Integration — Google Identity Services (GIS)
 *
 * Client-side only, no backend needed. The Google-signed JWT credential
 * is decoded client-side to extract user info (sub, email, name, picture).
 *
 * Set VITE_GOOGLE_CLIENT_ID in your .env to enable Google sign-in.
 * If not set, Google auth is gracefully disabled.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoogleUser {
  sub: string;        // unique Google user ID (stable, never changes)
  email: string;
  name: string;
  picture: string;
}

/** Google Identity Services global types (loaded dynamically) */
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  prompt: (notification?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
  renderButton: (
    parent: HTMLElement,
    options: { type?: string; theme?: string; size?: string; width?: number },
  ) => void;
  revoke: (hint: string, done: () => void) => void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Whether Google auth is available (client ID is configured).
 */
export function isGoogleAuthEnabled(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}

// ---------------------------------------------------------------------------
// Script loader
// ---------------------------------------------------------------------------

let scriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

/**
 * Load the Google Identity Services script dynamically.
 * Only loads once; subsequent calls return the same promise.
 */
function loadGISScript(): Promise<void> {
  if (scriptLoaded && window.google?.accounts) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    // Check if already loaded by someone else
    if (window.google?.accounts) {
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error('Failed to load Google Identity Services script'));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

// ---------------------------------------------------------------------------
// JWT decoder
// ---------------------------------------------------------------------------

/**
 * Decode a base64url-encoded JWT payload (no signature verification —
 * Google signs the credential, we trust it for client-side user info).
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  // base64url → base64
  let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  // Pad to multiple of 4
  while (payload.length % 4) payload += '=';

  const json = atob(payload);
  return JSON.parse(json);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize the Google Identity Services library.
 * Must be called before signInWithGoogle().
 */
export async function initGoogleAuth(): Promise<void> {
  if (!isGoogleAuthEnabled()) {
    throw new Error('Google auth is not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file.');
  }
  await loadGISScript();
}

/**
 * Trigger Google Sign-In popup and return the authenticated user info.
 *
 * Uses the One Tap / popup flow. Returns a promise that resolves with the
 * GoogleUser on success, or rejects if the user dismisses the popup.
 */
export function signInWithGoogle(): Promise<GoogleUser> {
  return new Promise<GoogleUser>(async (resolve, reject) => {
    if (!isGoogleAuthEnabled()) {
      reject(new Error('Google auth is not configured. Set VITE_GOOGLE_CLIENT_ID.'));
      return;
    }

    try {
      await loadGISScript();
    } catch (err) {
      reject(err);
      return;
    }

    const google = window.google;
    if (!google?.accounts) {
      reject(new Error('Google Identity Services not available'));
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        try {
          const payload = decodeJwtPayload(response.credential);
          const user: GoogleUser = {
            sub: payload.sub as string,
            email: payload.email as string,
            name: (payload.name as string) || (payload.email as string).split('@')[0],
            picture: (payload.picture as string) || '',
          };

          if (!user.sub || !user.email) {
            reject(new Error('Invalid Google credential — missing sub or email'));
            return;
          }

          resolve(user);
        } catch (err) {
          reject(new Error('Failed to decode Google credential'));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Trigger the One Tap prompt
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap was blocked (popup blocker, 3P cookies disabled, etc.)
        // Fall back to a rendered button approach
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.zIndex = '99999';
        container.style.background = 'white';
        container.style.borderRadius = '16px';
        container.style.padding = '32px';
        container.style.boxShadow = '0 25px 50px rgba(0,0,0,0.25)';
        container.id = 'roil-google-signin-fallback';

        // Overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.4)';
        overlay.style.zIndex = '99998';
        overlay.id = 'roil-google-signin-overlay';
        overlay.onclick = () => {
          overlay.remove();
          container.remove();
          reject(new Error('Google sign-in cancelled'));
        };

        document.body.appendChild(overlay);
        document.body.appendChild(container);

        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 300,
        });
      }
    });
  });
}
