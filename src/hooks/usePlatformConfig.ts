import { useQuery } from './useApi';

/**
 * usePlatformConfig — fetches `/api/portfolio/system/config` so the frontend
 * stays in sync with backend-controlled values like the platform fee rate
 * and the supported asset list, instead of duplicating literals on both
 * sides.
 *
 * Falls back to safe defaults when the backend is unreachable so the UI
 * still renders. The defaults mirror the backend's own defaults in
 * `config.platformFeeRate` so a stale frontend doesn't mislead users.
 */

export interface PlatformConfig {
  network: 'localnet' | 'devnet' | 'testnet' | 'mainnet';
  supportedAssets: string[];
  platformFeeRate: number;
}

const DEFAULT_PLATFORM_FEE_RATE = 0.001; // 0.1% — matches backend default

export function usePlatformConfig() {
  const { data, isLoading, error } = useQuery<PlatformConfig>(
    '/api/portfolio/system/config',
  );

  const platformFeeRate = data?.platformFeeRate ?? DEFAULT_PLATFORM_FEE_RATE;

  return {
    network: data?.network ?? 'mainnet',
    supportedAssets: data?.supportedAssets ?? [],
    platformFeeRate,
    isLoading,
    error,
    /** True while the backend value hasn't loaded — useful to gate UI that
     *  must not mislead the user with stale defaults (e.g. fee disclosure). */
    isFallback: !data,
  };
}
