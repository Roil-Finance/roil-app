/**
 * Runtime network-mismatch guard.
 *
 * Compares the backend `/health.network` value against the frontend's
 * `VITE_NETWORK` env. On mismatch we refuse to render — this prevents the
 * launch-day foot-gun where someone flips one env but not the other and
 * users see MainNet UI talking to a TestNet backend (or vice versa).
 */
import { useEffect, useState } from 'react';
import { config } from '../config';

export interface HealthGuardState {
  status: 'loading' | 'ok' | 'mismatch' | 'unreachable';
  backendNetwork?: string;
  error?: string;
}

export function useHealthGuard(): HealthGuardState {
  const [state, setState] = useState<HealthGuardState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${config.backendUrl}/health`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          if (!cancelled) setState({ status: 'unreachable', error: `HTTP ${res.status}` });
          return;
        }
        const body = (await res.json()) as { network?: string };
        const backendNetwork = (body.network ?? '').toLowerCase();
        if (!backendNetwork) {
          if (!cancelled) setState({ status: 'unreachable', error: 'health missing network field' });
          return;
        }
        if (backendNetwork !== config.network) {
          if (!cancelled) setState({ status: 'mismatch', backendNetwork });
          return;
        }
        if (!cancelled) setState({ status: 'ok', backendNetwork });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'unreachable',
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    };

    check();
    // Re-check periodically so a slow-rolling backend swap is caught.
    const handle = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, []);

  return state;
}
