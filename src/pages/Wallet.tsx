import { useState, useMemo, useCallback } from 'react';
import {
  Copy, Check, Eye, EyeOff, Lock, Unlock, Download, KeyRound,
  ShieldAlert, Trash2, Loader2, AlertTriangle, X, ArrowDownToLine,
} from 'lucide-react';
import { WalletManager } from '@/lib/wallet-core';
import { useWallet } from '@/hooks/useWallet';
import { useMarketPrices } from '@/hooks/useMarket';
import { useToast } from '@/components/Toast';
import { TOKEN_LOGOS, ASSET_COLORS } from '@/config';
import { XReserveModal } from '@/components/XReserveModal';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtUsd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function fmtAmount(n: number): string {
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

function truncate(str: string, len = 16): string {
  if (str.length <= len * 2 + 3) return str;
  return `${str.slice(0, len)}...${str.slice(-len)}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/* Modal backdrop                                                      */
/* ------------------------------------------------------------------ */

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[90vw] max-w-[460px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Copy button                                                         */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addToast('success', 'Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('error', 'Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-slate-200 hover:bg-[#E8EBF2] dark:hover:bg-slate-700 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-[#059669]" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Change Password Modal                                               */
/* ------------------------------------------------------------------ */

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { addToast } = useToast();
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!oldPwd || !newPwd || !confirmPwd) {
      setError('All fields are required.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('New passwords do not match.');
      return;
    }
    if (newPwd.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      // Export keystore with old password (validates it)
      const keystoreJson = await WalletManager.exportKeystore(oldPwd);
      // Re-import with new password (re-encrypts)
      await WalletManager.importFromKeystore(keystoreJson, oldPwd, newPwd);
      addToast('success', 'Password changed successfully.');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#111827] dark:text-slate-100">Change Password</h3>
        <button onClick={onClose} className="p-1 text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1">Current Password</label>
          <input
            type="password"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 text-[#111827] dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
            placeholder="Enter current password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1">New Password</label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 text-[#111827] dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 text-[#111827] dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
            placeholder="Re-enter new password"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#D6D9E3] dark:border-slate-600 text-sm font-medium text-[#6B7280] dark:text-slate-300 hover:bg-[#F3F4F9] dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-b from-[#059669] to-[#10B981] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> : null}
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/* ------------------------------------------------------------------ */
/* Show Private Key Modal                                              */
/* ------------------------------------------------------------------ */

function ShowKeyModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const handleReveal = async () => {
    setError(null);
    if (!password) {
      setError('Password is required.');
      return;
    }
    setLoading(true);
    try {
      // Unlock to verify password, then read keystore to get encrypted key
      const { wallet } = await WalletManager.unlockWallet(password);
      // The keystore is in localStorage — export it and parse to get the private key
      const keystoreJson = await WalletManager.exportKeystore(password);
      // We can't directly get the private key from exportKeystore (it's encrypted).
      // Instead, we use the fact that unlockWallet succeeded and use importFromKeystore
      // with same password to verify. But we need the actual key...
      // The cleanest approach: use the keystore data + password to decrypt manually.
      // Since WalletManager doesn't expose decryptPrivateKey, we re-derive it
      // by doing an import to a temporary name and reading back. But that would
      // overwrite the current wallet. Instead, let's parse the keystore and
      // decrypt using Web Crypto directly.
      const keystore = JSON.parse(keystoreJson);
      const key = await deriveAndDecrypt(
        keystore.crypto.ciphertext,
        keystore.crypto.iv,
        keystore.crypto.salt,
        password,
      );
      void wallet; // used for password verification
      setPrivateKey(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#111827] dark:text-slate-100">Private Key</h3>
        <button onClick={onClose} className="p-1 text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>
      </div>

      {!privateKey ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Never share your private key. Anyone with it has full control of your wallet.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1">Confirm Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
              className="w-full px-4 py-2.5 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 text-[#111827] dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D6D9E3] dark:border-slate-600 text-sm font-medium text-[#6B7280] dark:text-slate-300 hover:bg-[#F3F4F9] dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReveal}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-b from-[#059669] to-[#10B981] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> : null}
              {loading ? 'Verifying...' : 'Reveal Key'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">
              This is your private key. Store it securely and never share it.
            </p>
          </div>

          <div className="relative">
            <div className="w-full p-3 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-[#F3F4F9] dark:bg-slate-700 font-mono text-sm text-[#111827] dark:text-slate-100 break-all pr-20">
              {visible ? privateKey : '\u2022'.repeat(64)}
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <button
                onClick={() => setVisible(!visible)}
                className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-600 transition-colors"
              >
                {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <CopyButton text={privateKey} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-b from-[#059669] to-[#10B981] hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </ModalBackdrop>
  );
}

/* ------------------------------------------------------------------ */
/* Delete Wallet Modal                                                 */
/* ------------------------------------------------------------------ */

function DeleteWalletModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState('');

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Delete Wallet</h3>
        <button onClick={onClose} className="p-1 text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">
            This action is irreversible. Make sure you have exported your keystore before proceeding.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#111827] dark:text-slate-200 mb-1">
            Type <span className="font-bold text-red-600">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-slate-700 text-[#111827] dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="DELETE"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#D6D9E3] dark:border-slate-600 text-sm font-medium text-[#6B7280] dark:text-slate-300 hover:bg-[#F3F4F9] dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={typed !== 'DELETE'}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4 inline mr-1.5" />
            Delete Wallet
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/* ------------------------------------------------------------------ */
/* Crypto helper — decrypt private key (mirrors wallet-core internals) */
/* ------------------------------------------------------------------ */

async function deriveAndDecrypt(
  ciphertextHex: string,
  ivHex: string,
  saltHex: string,
  password: string,
): Promise<string> {
  const hexToBytes = (hex: string) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
  };

  const salt = hexToBytes(saltHex);
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);

  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 310_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );

  return new TextDecoder().decode(decrypted);
}

/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */

export default function WalletPage() {
  const { addToast } = useToast();
  const wallet = useWallet();
  const { prices, priceMap, isLoading: pricesLoading } = useMarketPrices();
  const walletInfo = wallet.walletInfo ?? WalletManager.getWalletInfo();

  // Modal states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Public key expand
  const [pubKeyExpanded, setPubKeyExpanded] = useState(false);

  // Unlock password input
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const isConnected = wallet.connected;

  // Derived: total portfolio value
  const totalValueUsd = useMemo(() => {
    if (!wallet.balances || wallet.balances.length === 0) return 0;
    return wallet.balances.reduce((sum, b) => {
      const price = priceMap.get(b.instrumentId) ?? 1;
      return sum + b.amount * price;
    }, 0);
  }, [wallet.balances, priceMap]);

  // Handle unlock
  const handleUnlock = useCallback(async () => {
    setUnlockError(null);
    try {
      await wallet.connect(unlockPassword);
      setUnlockPassword('');
      addToast('success', 'Wallet unlocked.');
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Failed to unlock wallet.');
    }
  }, [wallet, unlockPassword, addToast]);

  // Handle lock
  const handleLock = useCallback(async () => {
    await wallet.disconnect();
    addToast('info', 'Wallet locked.');
  }, [wallet, addToast]);

  // Handle export keystore
  const handleExport = useCallback(async () => {
    setExportLoading(true);
    try {
      // Prompt for password
      const pwd = prompt('Enter your password to export keystore:');
      if (!pwd) { setExportLoading(false); return; }

      const json = await WalletManager.exportKeystore(pwd);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roil-wallet-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('success', 'Keystore exported.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExportLoading(false);
    }
  }, [addToast]);

  // Handle delete wallet
  const handleDelete = useCallback(() => {
    WalletManager.deleteWallet();
    wallet.disconnect();
    addToast('info', 'Wallet deleted.');
    setShowDeleteConfirm(false);
    // Redirect to login
    window.location.href = '/login';
  }, [wallet, addToast]);

  // No wallet exists
  if (!walletInfo && !WalletManager.hasWallet()) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 font-['DM_Sans']">
        <div className="text-center">
          <KeyRound className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
          <h1 className="text-[26px] font-bold text-[#111827] dark:text-slate-100 mb-2">No Wallet Found</h1>
          <p className="text-[#6B7280] dark:text-slate-400 text-sm max-w-md">
            Create a wallet or sign up to get started with Roil App.
          </p>
        </div>
        <a
          href="/signup"
          className="px-6 py-3 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#059669] to-[#10B981] hover:opacity-90 transition-opacity shadow-md"
        >
          Create Wallet
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 h-full font-['DM_Sans']">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-[26px] font-bold text-[#111827] dark:text-slate-100 leading-tight">
          Wallet
        </h1>
        {isConnected ? (
          <button
            onClick={handleLock}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#D6D9E3] dark:border-slate-600 text-[#6B7280] dark:text-slate-300 hover:bg-[#F3F4F9] dark:hover:bg-slate-700 transition-colors"
          >
            <Lock className="w-4 h-4" />
            Lock Wallet
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Password"
              className="px-4 py-2.5 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 text-[#111827] dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] w-48"
            />
            <button
              onClick={handleUnlock}
              disabled={wallet.isConnecting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-b from-[#059669] to-[#10B981] hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
            >
              {wallet.isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
              Unlock
            </button>
          </div>
        )}
      </div>

      {unlockError && (
        <div className="flex items-center gap-2 text-sm text-red-500 -mt-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {unlockError}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
        {/* ==================== LEFT COLUMN ==================== */}
        <div className="flex-1 space-y-5">
          {/* --- Wallet Overview Card --- */}
          <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#111827] dark:text-slate-100">Wallet Overview</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-[#059669]' : 'bg-red-500'}`} />
                <span className={`text-xs font-medium ${isConnected ? 'text-[#059669]' : 'text-red-500'}`}>
                  {isConnected ? 'Connected' : 'Locked'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <span className="text-xs font-medium text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Display Name</span>
                <p className="text-sm font-semibold text-[#111827] dark:text-slate-100 mt-0.5">
                  {walletInfo?.displayName ?? '---'}
                </p>
              </div>

              {/* Party ID */}
              <div>
                <span className="text-xs font-medium text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Party ID</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-mono text-[#111827] dark:text-slate-100 break-all flex-1">
                    {walletInfo?.partyId ?? '---'}
                  </p>
                  {walletInfo?.partyId && <CopyButton text={walletInfo.partyId} />}
                </div>
              </div>

              {/* Public Key */}
              <div>
                <span className="text-xs font-medium text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Public Key</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    onClick={() => setPubKeyExpanded(!pubKeyExpanded)}
                    className="text-sm font-mono text-[#111827] dark:text-slate-100 break-all text-left flex-1 hover:text-[#059669] dark:hover:text-[#10B981] transition-colors"
                  >
                    {walletInfo?.publicKey
                      ? pubKeyExpanded
                        ? walletInfo.publicKey
                        : truncate(walletInfo.publicKey, 12)
                      : '---'}
                  </button>
                  {walletInfo?.publicKey && <CopyButton text={walletInfo.publicKey} />}
                </div>
                {walletInfo?.publicKey && (
                  <button
                    onClick={() => setPubKeyExpanded(!pubKeyExpanded)}
                    className="text-xs text-[#059669] hover:underline mt-0.5"
                  >
                    {pubKeyExpanded ? 'Collapse' : 'Expand'}
                  </button>
                )}
              </div>

              {/* Created */}
              <div>
                <span className="text-xs font-medium text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Created</span>
                <p className="text-sm text-[#111827] dark:text-slate-100 mt-0.5">
                  {walletInfo?.createdAt ? formatDate(walletInfo.createdAt) : '---'}
                </p>
              </div>
            </div>
          </div>

          {/* --- Balances Card --- */}
          <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#111827] dark:text-slate-100">Balances</h2>
              <div className="flex items-center gap-3">
                {!pricesLoading && wallet.balances && wallet.balances.length > 0 && (
                  <span className="text-sm font-bold text-[#111827] dark:text-slate-100">
                    {fmtUsd(totalValueUsd)}
                  </span>
                )}
                {isConnected && (
                  <button
                    onClick={() => setShowDepositModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    Deposit
                  </button>
                )}
              </div>
            </div>

            {!isConnected ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Lock className="w-8 h-8 text-[#9CA3AF] dark:text-slate-500 mb-3" />
                <p className="text-sm text-[#6B7280] dark:text-slate-400">
                  Unlock your wallet to view balances.
                </p>
              </div>
            ) : !wallet.balances || wallet.balances.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <p className="text-sm text-[#6B7280] dark:text-slate-400">
                  No balances — deposit USDC from Ethereum, Base, Arbitrum or other chains to get started.
                </p>
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Deposit USDC
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {wallet.balances.map((bal) => {
                  const price = priceMap.get(bal.instrumentId) ?? 1;
                  const usdValue = bal.amount * price;
                  const tokenColor = ASSET_COLORS[bal.instrumentId] ?? '#6B7280';
                  const logo = TOKEN_LOGOS[bal.instrumentId];

                  return (
                    <div
                      key={bal.instrumentId}
                      className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {logo ? (
                          <img
                            src={logo}
                            alt={bal.instrumentId}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: tokenColor }}
                          >
                            {bal.instrumentId.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-semibold text-[#111827] dark:text-slate-100">
                            {bal.instrumentId}
                          </span>
                          <p className="text-xs text-[#6B7280] dark:text-slate-400">
                            {fmtAmount(bal.amount)} tokens
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-[#111827] dark:text-slate-100">
                          {fmtUsd(usdValue)}
                        </span>
                        {prices.find((p) => p.symbol === bal.instrumentId)?.change24h !== undefined && (
                          <p
                            className="text-xs font-medium"
                            style={{
                              color: (prices.find((p) => p.symbol === bal.instrumentId)?.change24h ?? 0) >= 0
                                ? '#059669'
                                : '#E11D48',
                            }}
                          >
                            {(prices.find((p) => p.symbol === bal.instrumentId)?.change24h ?? 0) >= 0 ? '+' : ''}
                            {prices.find((p) => p.symbol === bal.instrumentId)?.change24h?.toFixed(2)}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ==================== RIGHT COLUMN ==================== */}
        <div className="w-full lg:w-[380px] space-y-5">
          {/* --- Security Card --- */}
          <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5">
            <h2 className="text-lg font-bold text-[#111827] dark:text-slate-100 mb-4">Security</h2>

            <div className="space-y-3">
              {/* Change Password */}
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-[#ECEEF4] dark:hover:bg-slate-600 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#E0F5EA] flex items-center justify-center shrink-0">
                  <KeyRound className="w-4.5 h-4.5 text-[#059669]" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-[#111827] dark:text-slate-100">Change Password</span>
                  <p className="text-xs text-[#6B7280] dark:text-slate-400">Update your wallet encryption password</p>
                </div>
              </button>

              {/* Export Keystore */}
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-[#ECEEF4] dark:hover:bg-slate-600 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-lg bg-[#E0E7FF] flex items-center justify-center shrink-0">
                  {exportLoading ? (
                    <Loader2 className="w-4.5 h-4.5 text-[#6366F1] animate-spin" />
                  ) : (
                    <Download className="w-4.5 h-4.5 text-[#6366F1]" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-[#111827] dark:text-slate-100">Export Keystore</span>
                  <p className="text-xs text-[#6B7280] dark:text-slate-400">Download encrypted wallet backup</p>
                </div>
              </button>

              {/* Show Private Key */}
              <button
                onClick={() => setShowPrivateKey(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-[#ECEEF4] dark:hover:bg-slate-600 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FEF3C7] flex items-center justify-center shrink-0">
                  <Eye className="w-4.5 h-4.5 text-[#D97706]" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-[#111827] dark:text-slate-100">Show Private Key</span>
                  <p className="text-xs text-[#6B7280] dark:text-slate-400">Reveal key (requires password)</p>
                </div>
              </button>

              {/* Last Login */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-[#F3F4F9] dark:bg-slate-600 flex items-center justify-center shrink-0">
                  <Lock className="w-4.5 h-4.5 text-[#9CA3AF]" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-[#6B7280] dark:text-slate-400">Last Login</span>
                  <p className="text-xs text-[#111827] dark:text-slate-200">
                    {isConnected ? 'Currently active' : 'Locked'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* --- Danger Zone Card --- */}
          <div className="bg-[#F3F4F9] dark:bg-slate-800 border-2 border-red-300 dark:border-red-800 rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5">
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-[#6B7280] dark:text-slate-400 mb-4">
              This action is irreversible. Make sure you have exported your keystore.
            </p>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Wallet
            </button>
          </div>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
      {showPrivateKey && (
        <ShowKeyModal onClose={() => setShowPrivateKey(false)} />
      )}
      {showDeleteConfirm && (
        <DeleteWalletModal
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
      <XReserveModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        cantonParty={walletInfo?.partyId ?? ''}
      />
    </div>
  );
}
