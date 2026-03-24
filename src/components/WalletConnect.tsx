import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Wallet,
  ChevronDown,
  LogOut,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import clsx from 'clsx';
import { useWallet } from '@/hooks/useWallet';
import { truncateParty } from '@/lib/canton-wallet';
import { WalletManager } from '@/lib/wallet-core';
import WalletSetup from '@/components/WalletSetup';

// ---------------------------------------------------------------------------
// WalletConnect component
//
// Three states:
//   1. No wallet: "Create Wallet" button -> opens WalletSetup overlay
//   2. Wallet locked: "Unlock" button -> inline password prompt
//   3. Wallet unlocked: party info + dropdown with balances / disconnect
// ---------------------------------------------------------------------------

export default function WalletConnect() {
  const {
    connected,
    party,
    displayName,
    balances,
    connect,
    disconnect,
    refreshBalances,
    isConnecting,
    error,
  } = useWallet();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showUnlockPw, setShowUnlockPw] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [copiedParty, setCopiedParty] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unlockRef = useRef<HTMLDivElement>(null);

  const hasWallet = WalletManager.hasWallet();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        unlockRef.current &&
        !unlockRef.current.contains(e.target as Node) &&
        showUnlock
      ) {
        setShowUnlock(false);
        setUnlockPassword('');
        setUnlockError(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUnlock]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleUnlock = useCallback(async () => {
    if (!unlockPassword) {
      setUnlockError('Please enter your password');
      return;
    }
    setIsUnlocking(true);
    setUnlockError(null);
    try {
      await connect(unlockPassword);
      setShowUnlock(false);
      setUnlockPassword('');
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Unlock failed');
    } finally {
      setIsUnlocking(false);
    }
  }, [unlockPassword, connect]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setDropdownOpen(false);
  }, [disconnect]);

  const handleRefresh = useCallback(async () => {
    await refreshBalances();
  }, [refreshBalances]);

  const handleCopyParty = useCallback(async () => {
    if (!party) return;
    try {
      await navigator.clipboard.writeText(party);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = party;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedParty(true);
    setTimeout(() => setCopiedParty(false), 2000);
  }, [party]);

  const handleWalletCreated = useCallback(() => {
    setShowSetup(false);
    // After creation, show unlock prompt
    setShowUnlock(true);
  }, []);

  // CC balance summary
  const ccBalance = balances.find((b) => b.instrumentId === 'CC');
  const ccTotal = ccBalance ? ccBalance.amount : null;

  const walletInfo = WalletManager.getWalletInfo();

  // -----------------------------------------------------------------------
  // Render: WalletSetup overlay
  // -----------------------------------------------------------------------

  if (showSetup) {
    return (
      <>
        {/* Overlay backdrop */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <WalletSetup
            onComplete={handleWalletCreated}
            onCancel={() => setShowSetup(false)}
          />
        </div>
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Render: No wallet — show "Create Wallet"
  // -----------------------------------------------------------------------

  if (!hasWallet) {
    return (
      <div className="flex items-center">
        <button
          onClick={() => setShowSetup(true)}
          className="flex items-center gap-2 bg-gradient-to-br from-[#059669] to-[#10B981] text-white text-sm font-semibold py-2 px-4 rounded-xl shadow-[0_2px_8px_#05966930] transition hover:opacity-90"
        >
          <Wallet className="w-4 h-4" />
          Create Wallet
        </button>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Wallet exists but not connected (locked)
  // -----------------------------------------------------------------------

  if (!connected) {
    return (
      <div className="relative flex items-center" ref={unlockRef}>
        {showUnlock ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type={showUnlockPw ? 'text' : 'password'}
                value={unlockPassword}
                onChange={(e) => { setUnlockPassword(e.target.value); setUnlockError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
                placeholder="Password"
                disabled={isUnlocking}
                className="w-[180px] rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500 focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669] disabled:opacity-60 pr-8"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowUnlockPw(!showUnlockPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
              >
                {showUnlockPw ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <button
              onClick={handleUnlock}
              disabled={isUnlocking || !unlockPassword}
              className="flex items-center gap-1.5 bg-gradient-to-br from-[#059669] to-[#10B981] text-white text-sm font-semibold py-2 px-3.5 rounded-xl shadow-[0_2px_8px_#05966930] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUnlocking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              {isUnlocking ? '' : 'Unlock'}
            </button>
            <button
              onClick={() => { setShowUnlock(false); setUnlockPassword(''); setUnlockError(null); }}
              className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors px-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowUnlock(true)}
            disabled={isConnecting}
            className="flex items-center gap-2 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 py-2 px-4 text-sm font-medium text-[#111827] dark:text-slate-200 transition hover:bg-[#F3F4F9] dark:hover:bg-slate-600 hover:border-[#059669] disabled:opacity-50"
          >
            <Lock className="w-4 h-4 text-[#6B7280]" />
            <span>{walletInfo?.displayName || 'Wallet'}</span>
            <span className="text-xs text-[#9CA3AF] font-mono">
              {walletInfo?.partyId ? truncateParty(walletInfo.partyId, 3) : 'Locked'}
            </span>
          </button>
        )}

        {/* Unlock error tooltip */}
        {unlockError && (
          <div className="absolute top-full mt-1.5 right-0 z-50 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 shadow-sm whitespace-nowrap">
            {unlockError}
          </div>
        )}

        {/* General error */}
        {error && !unlockError && (
          <p className="absolute top-full mt-1 right-0 text-xs text-red-600 whitespace-nowrap">{error}</p>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Connected state
  // -----------------------------------------------------------------------

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Connected button / trigger */}
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className={clsx(
          'flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors',
          'bg-white dark:bg-slate-700 hover:bg-[#F3F4F9] dark:hover:bg-slate-600 border border-[#D6D9E3] dark:border-slate-600',
        )}
      >
        {/* Green status dot */}
        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />

        <div className="min-w-0">
          <p className="text-sm font-medium text-[#111827] dark:text-slate-100 truncate">
            {displayName ?? 'Connected'}
          </p>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 font-mono truncate">
            {party ? truncateParty(party) : ''}
          </p>
        </div>

        <ChevronDown
          className={clsx(
            'w-4 h-4 text-[#9CA3AF] transition-transform shrink-0 ml-1',
            dropdownOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-[320px] bg-white dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Balance summary */}
          <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                Balances
              </span>
              <button
                onClick={handleRefresh}
                className="text-[#6B7280] hover:text-[#111827] transition-colors"
                title="Refresh balances"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {balances.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                {balances.map((b) => (
                  <div
                    key={b.instrumentId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-[#111827] dark:text-slate-200 font-medium">
                      {b.instrumentId}
                    </span>
                    <div className="text-right">
                      <span className="text-sm text-[#111827] dark:text-slate-200 font-medium">
                        {b.amount.toLocaleString()}
                      </span>
                      {b.locked > 0 && (
                        <span className="text-xs text-[#6B7280] ml-1">
                          ({b.locked.toLocaleString()} locked)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {ccTotal !== null && (
                  <div className="pt-1.5 mt-1.5 border-t border-[#E5E7EB] flex items-center justify-between">
                    <span className="text-xs text-[#6B7280]">CC Balance</span>
                    <span className="text-sm text-[#111827] dark:text-slate-100 font-semibold">
                      {ccTotal.toLocaleString()} CC
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#9CA3AF] mt-2">
                No balances found
              </p>
            )}
          </div>

          {/* Party info */}
          <div className="px-4 py-2.5 border-b border-[#E5E7EB] dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#6B7280]">Party ID</p>
              <button
                onClick={handleCopyParty}
                className="flex items-center gap-1 text-xs text-[#059669] hover:text-[#047857] transition-colors"
              >
                {copiedParty ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-[#111827] dark:text-slate-200 font-mono break-all">
              {party}
            </p>
          </div>

          {/* Disconnect */}
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="absolute top-full mt-1 right-0 text-xs text-red-600 whitespace-nowrap">{error}</p>
      )}
    </div>
  );
}
