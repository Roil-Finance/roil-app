import { useEffect, useRef } from 'react';
import { config } from '@/config';
import { useToast } from '@/components/Toast';

type EventHandler = (data: unknown) => void;

interface UseEventStreamOptions {
  party?: string;
  onRebalance?: EventHandler;
  onDCA?: EventHandler;
  onPortfolioUpdate?: EventHandler;
  enabled?: boolean;
}

/**
 * Subscribe to real-time Server-Sent Events from the Canton transaction stream.
 * Events are pushed when contracts are created/archived on the ledger.
 */
export function useEventStream({
  party,
  onRebalance,
  onDCA,
  onPortfolioUpdate,
  enabled = true,
}: UseEventStreamOptions) {
  const { addToast } = useToast();
  const sourceRef = useRef<EventSource | null>(null);

  // Keep refs to callbacks so the effect always calls the latest version
  // without needing to reconnect the EventSource when callbacks change.
  const onRebalanceRef = useRef(onRebalance);
  const onDCARef = useRef(onDCA);
  const onPortfolioUpdateRef = useRef(onPortfolioUpdate);
  const addToastRef = useRef(addToast);

  useEffect(() => { onRebalanceRef.current = onRebalance; });
  useEffect(() => { onDCARef.current = onDCA; });
  useEffect(() => { onPortfolioUpdateRef.current = onPortfolioUpdate; });
  useEffect(() => { addToastRef.current = addToast; });

  useEffect(() => {
    if (!party || !enabled) return;

    const url = `${config.backendUrl}/api/portfolio/${encodeURIComponent(party)}/events`;
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onopen = () => {
      // Connected
    };

    source.addEventListener('rebalance', (e) => {
      try {
        const data = JSON.parse(e.data);
        onRebalanceRef.current?.(data);
        // Check if notifications are enabled (from localStorage)
        const notificationsEnabled = localStorage.getItem('notifications') !== 'false';
        if (notificationsEnabled) {
          addToastRef.current('success', 'Portfolio rebalanced — ledger updated');
        }
      } catch { /* ignore parse errors */ }
    });

    source.addEventListener('dca', (e) => {
      try {
        const data = JSON.parse(e.data);
        onDCARef.current?.(data);
        const notificationsEnabled = localStorage.getItem('notifications') !== 'false';
        if (notificationsEnabled) {
          addToastRef.current('info', 'DCA execution completed');
        }
      } catch { /* ignore */ }
    });

    source.addEventListener('portfolio', (e) => {
      try {
        const data = JSON.parse(e.data);
        onPortfolioUpdateRef.current?.(data);
      } catch { /* ignore */ }
    });

    source.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [party, enabled]);
}
