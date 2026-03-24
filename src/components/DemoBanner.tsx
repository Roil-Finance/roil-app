import { AlertTriangle } from 'lucide-react';

interface DemoBannerProps {
  visible: boolean;
}

/**
 * Subtle banner shown when any data hook falls back to demo data
 * because the backend is unavailable.
 */
export default function DemoBanner({ visible }: DemoBannerProps) {
  if (!visible) return null;

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm font-medium">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>Demo Mode — Backend unavailable, showing sample data</span>
    </div>
  );
}
