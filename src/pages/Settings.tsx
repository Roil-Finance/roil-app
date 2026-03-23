import { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, Key, Timer, Loader2, Check, AlertCircle } from 'lucide-react';
import { useQuery, useMutation } from '@/hooks/useApi';
import { useParty } from '@/context/PartyContext';

// ---------------------------------------------------------------------------
// Toggle Component
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="relative w-[48px] h-[28px] rounded-full cursor-pointer transition-all duration-200"
      style={{ backgroundColor: checked ? '#059669' : '#E5E7EB' }}
    >
      <div
        className="absolute top-[2px] left-[2px] w-[24px] h-[24px] bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slippage options
// ---------------------------------------------------------------------------

const SLIPPAGE_OPTIONS = [0.5, 1.0, 2.0, 5.0];

// ---------------------------------------------------------------------------
// Strategy options
// ---------------------------------------------------------------------------

const STRATEGIES = [
  {
    id: 'portfolio-targets',
    name: 'Portfolio Targets',
    description: 'Reinvest yields according to target allocation',
  },
  {
    id: 'same-asset',
    name: 'Same Asset',
    description: 'Reinvest back into the same yielding asset',
  },
  {
    id: 'usdc-only',
    name: 'USDC Only',
    description: 'Convert all yields to stablecoin',
  },
];

// ---------------------------------------------------------------------------
// Notification rows
// ---------------------------------------------------------------------------

const NOTIFICATION_DEFAULTS: { label: string; defaultOn: boolean }[] = [
  { label: 'Rebalance alerts', defaultOn: true },
  { label: 'DCA execution', defaultOn: true },
  { label: 'Reward payouts', defaultOn: true },
  { label: 'Price alerts', defaultOn: false },
];

// ---------------------------------------------------------------------------
// Backend config type
// ---------------------------------------------------------------------------

interface CompoundConfig {
  enabled: boolean;
  minAmount: number;
  frequency: string;
  reinvestStrategy: string;
}

// ---------------------------------------------------------------------------
// localStorage cache helpers
// ---------------------------------------------------------------------------

const LS_KEY = 'roil-settings';

interface CachedSettings {
  autoRebalance: boolean;
  driftThreshold: number;
  slippage: number;
  compoundStrategy: string;
  notifications: boolean[];
}

function loadCachedSettings(): CachedSettings | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedSettings;
  } catch {
    return null;
  }
}

function saveCachedSettings(s: CachedSettings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    // localStorage full or disabled — ignore
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Settings() {
  const { party } = useParty();

  // Fetch compound config from backend
  const configPath = party
    ? `/api/compound/${encodeURIComponent(party)}/config`
    : null;
  const {
    data: backendConfig,
    isLoading: isLoadingConfig,
  } = useQuery<CompoundConfig>(configPath, [party]);

  // Save mutation
  const {
    mutate: saveConfig,
    isLoading: isSaving,
    error: saveError,
  } = useMutation<CompoundConfig, CompoundConfig>(
    `/api/compound/${encodeURIComponent(party)}/config`,
    'PUT',
  );

  // Load initial state from localStorage cache
  const cached = useRef(loadCachedSettings());

  // Auto-Rebalance
  const [autoRebalance, setAutoRebalance] = useState(
    cached.current?.autoRebalance ?? true,
  );
  const [driftThreshold, setDriftThreshold] = useState(
    cached.current?.driftThreshold ?? 5,
  );

  // Max Slippage
  const [slippage, setSlippage] = useState(cached.current?.slippage ?? 0.5);

  // Auto-Compound Strategy
  const [compoundStrategy, setCompoundStrategy] = useState(
    cached.current?.compoundStrategy ?? 'portfolio-targets',
  );

  // Notifications
  const [notifications, setNotifications] = useState<boolean[]>(
    cached.current?.notifications ?? NOTIFICATION_DEFAULTS.map((n) => n.defaultOn),
  );

  // Save feedback
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When backend config arrives, hydrate local state
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (backendConfig && !hydratedRef.current) {
      hydratedRef.current = true;
      setAutoRebalance(backendConfig.enabled);
      if (backendConfig.reinvestStrategy) {
        setCompoundStrategy(backendConfig.reinvestStrategy);
      }
      // minAmount can map to driftThreshold if backend uses it that way
      // frequency from backend could inform slippage or other settings
      // For now we sync what the backend provides
    }
  }, [backendConfig]);

  const toggleNotification = (index: number) => {
    setNotifications((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  // Gather current settings snapshot
  const gatherSettings = useCallback(
    (): CachedSettings => ({
      autoRebalance,
      driftThreshold,
      slippage,
      compoundStrategy,
      notifications,
    }),
    [autoRebalance, driftThreshold, slippage, compoundStrategy, notifications],
  );

  // Keep localStorage cache in sync on every change
  useEffect(() => {
    saveCachedSettings(gatherSettings());
  }, [gatherSettings]);

  // Handle explicit save
  const handleSave = async () => {
    setShowSaved(false);

    const payload: CompoundConfig = {
      enabled: autoRebalance,
      minAmount: driftThreshold,
      frequency: `${slippage}`,
      reinvestStrategy: compoundStrategy,
    };

    try {
      await saveConfig(payload);
      // Also persist to localStorage
      saveCachedSettings(gatherSettings());
      setShowSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setShowSaved(false), 3000);
    } catch {
      // error captured via saveError from the hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold text-ink">Settings</h1>
        <div className="flex items-center gap-3">
          {/* Save confirmation */}
          {showSaved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-[#059669]">
              <Check className="w-4 h-4" />
              Saved
            </span>
          )}
          {saveError && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-red-500">
              <AlertCircle className="w-4 h-4" />
              Save failed
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoadingConfig && (
        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading settings...
        </div>
      )}

      <div className="flex gap-6">
      {/* ==================== LEFT COLUMN ==================== */}
      <div className="flex-1 space-y-5">
        {/* --- Auto-Rebalance Card --- */}
        <div className="bg-[#F3F4F9] border border-surface-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-ink">Auto-Rebalance</span>
            <Toggle checked={autoRebalance} onChange={setAutoRebalance} />
          </div>
          <p className="text-sm text-ink-secondary mb-5">
            Automatically rebalance your portfolio when allocation drifts beyond
            the set threshold.
          </p>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Drift Threshold</span>
            <span className="text-xs font-semibold bg-[#E0F5EA] text-[#059669] px-2.5 py-0.5 rounded-full">
              {driftThreshold.toFixed(1)}%
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={20}
            step={0.1}
            value={driftThreshold}
            onChange={(e) => setDriftThreshold(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#059669' }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-ink-muted">1%</span>
            <span className="text-xs text-ink-muted">20%</span>
          </div>
        </div>

        {/* --- Max Slippage Card --- */}
        <div className="bg-[#F3F4F9] border border-surface-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-ink">Max Slippage</span>
            <span className="text-xs font-semibold bg-[#E0F5EA] text-[#059669] px-2.5 py-0.5 rounded-full">
              {slippage.toFixed(1)}%
            </span>
          </div>

          <div className="flex gap-3">
            {SLIPPAGE_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setSlippage(opt)}
                className={
                  slippage === opt
                    ? 'flex-1 py-2 rounded-xl text-sm font-medium bg-[#059669] text-white transition-colors'
                    : 'flex-1 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors'
                }
              >
                {opt.toFixed(1)}%
              </button>
            ))}
          </div>
        </div>

        {/* --- Auto-Compound Strategy Card --- */}
        <div className="bg-[#F3F4F9] border border-surface-border rounded-2xl p-6">
          <span className="text-lg font-semibold text-ink block mb-4">
            Auto-Compound Strategy
          </span>

          <div className="space-y-3">
            {STRATEGIES.map((s) => {
              const selected = compoundStrategy === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setCompoundStrategy(s.id)}
                  className={`w-full text-left bg-white rounded-xl p-[14px_18px] transition-all ${
                    selected
                      ? 'border-2 border-[#059669]'
                      : 'border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Radio dot */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected ? 'border-[#059669]' : 'border-gray-300'
                      }`}
                    >
                      {selected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-ink">{s.name}</div>
                      <div className="text-xs text-ink-secondary mt-0.5">
                        {s.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== RIGHT COLUMN ==================== */}
      <div className="w-[380px] space-y-5">
        {/* --- Notifications Card --- */}
        <div className="bg-[#F3F4F9] border border-surface-border rounded-2xl p-6">
          <span className="text-lg font-semibold text-ink block mb-4">
            Notifications
          </span>

          <div className="space-y-4">
            {NOTIFICATION_DEFAULTS.map((item, idx) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-ink">{item.label}</span>
                <Toggle
                  checked={notifications[idx]}
                  onChange={() => toggleNotification(idx)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* --- Security Card --- */}
        <div className="bg-[#F3F4F9] border border-surface-border rounded-2xl p-6">
          <span className="text-lg font-semibold text-ink block mb-4">
            Security
          </span>

          <div className="space-y-4">
            {/* Wallet Connected */}
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#059669] shrink-0" />
              <span className="text-sm text-ink flex-1">Wallet Connected</span>
              <span className="text-xs font-semibold bg-[#E0F5EA] text-[#059669] px-2.5 py-0.5 rounded-full">
                Verified
              </span>
            </div>

            {/* 2FA */}
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-[#059669] shrink-0" />
              <span className="text-sm text-ink flex-1">2FA</span>
              <span className="text-xs font-semibold bg-[#E0F5EA] text-[#059669] px-2.5 py-0.5 rounded-full">
                Enabled
              </span>
            </div>

            {/* Last Login */}
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-gray-400 shrink-0" />
              <span className="text-sm text-ink flex-1">Last Login</span>
              <span className="text-xs font-medium text-gray-500">
                2 hours ago
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
