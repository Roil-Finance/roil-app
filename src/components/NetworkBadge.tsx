import { config } from '@/config';

/**
 * Persistent network indicator. Renders a coloured pill in the header so the
 * user (and any reviewer seeing a screenshot or video) always knows which
 * Canton environment the app is connected to. Mainnet produces no badge.
 */
export default function NetworkBadge() {
  if (config.network === 'mainnet') return null;

  const palette: Record<string, { pill: string; dot: string; label: string }> = {
    testnet: {
      pill: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200',
      dot: 'bg-amber-500',
      label: 'Canton TestNet',
    },
    devnet: {
      pill: 'bg-sky-100 dark:bg-sky-900/40 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200',
      dot: 'bg-sky-500',
      label: 'Canton DevNet',
    },
    localnet: {
      pill: 'bg-slate-200 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-200',
      dot: 'bg-slate-500',
      label: 'LocalNet',
    },
  };
  const style = palette[config.network] ?? palette.testnet;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 border rounded-full text-xs font-semibold ${style.pill}`}
      title={`Connected to Canton ${config.network}. Not real value.`}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`} />
      {style.label}
    </div>
  );
}
