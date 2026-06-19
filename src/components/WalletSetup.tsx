import { useState, useCallback } from 'react';
import {
  Wallet,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  Download,
  Upload,
  Shield,
  AlertTriangle,
  Loader2,
  X,
  Fingerprint,
} from 'lucide-react';
import { WalletManager, type RoilWallet } from '@/lib/wallet-core';
import { isPasskeySupported } from '@/lib/passkey-auth';
import { isGoogleAuthEnabled, signInWithGoogle } from '@/lib/google-auth';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WalletSetupProps {
  onComplete: (wallet: RoilWallet) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Mode = 'choose' | 'create' | 'create-passkey' | 'import-key' | 'import-keystore' | 'success';

/** Password strength: 0 = weak, 1 = fair, 2 = good, 3 = strong */
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-400' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-yellow-400' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-blue-400' };
  return { score: 4, label: 'Strong', color: 'bg-green-500' };
}

function truncateHex(hex: string, head = 8, tail = 8): string {
  if (hex.length <= head + tail + 3) return hex;
  return `${hex.slice(0, head)}...${hex.slice(-tail)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WalletSetup({ onComplete, onCancel }: WalletSetupProps) {
  const [mode, setMode] = useState<Mode>('choose');

  // --- Create wallet state ---
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- Import state ---
  const [importKey, setImportKey] = useState('');
  const [keystoreJson, setKeystoreJson] = useState('');
  const [keystoreOldPassword, setKeystoreOldPassword] = useState('');

  // --- Shared state ---
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdWallet, setCreatedWallet] = useState<RoilWallet | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hasBackedUp, setHasBackedUp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleEnabled = isGoogleAuthEnabled();

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const handleGoogleWallet = useCallback(async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      const wallet = await WalletManager.createFromOAuth(
        'google',
        googleUser.sub,
        googleUser.email,
      );
      setCreatedWallet(wallet);
      setMode('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  }, []);

  const handleCreate = useCallback(async () => {
    setError(null);

    if (!name.trim()) {
      setError('Please enter a display name');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsProcessing(true);
    try {
      const wallet = await WalletManager.createWallet(name.trim(), password);
      setCreatedWallet(wallet);
      setMode('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsProcessing(false);
    }
  }, [name, password, confirmPassword]);

  const handleCreateWithPasskey = useCallback(async () => {
    setError(null);

    if (!name.trim()) {
      setError('Please enter a display name');
      return;
    }

    setIsProcessing(true);
    try {
      const wallet = await WalletManager.createFromPasskey(name.trim());
      setCreatedWallet(wallet);
      setMode('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey registration failed');
    } finally {
      setIsProcessing(false);
    }
  }, [name]);

  const handleImportKey = useCallback(async () => {
    setError(null);

    if (!importKey.trim()) {
      setError('Please enter a private key');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a display name');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsProcessing(true);
    try {
      const wallet = await WalletManager.importFromKey(importKey.trim(), name.trim(), password);
      setCreatedWallet(wallet);
      setMode('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import key');
    } finally {
      setIsProcessing(false);
    }
  }, [importKey, name, password, confirmPassword]);

  const handleImportKeystore = useCallback(async () => {
    setError(null);

    if (!keystoreJson.trim()) {
      setError('Please paste the keystore JSON');
      return;
    }
    if (!keystoreOldPassword) {
      setError('Please enter the keystore password');
      return;
    }
    if (password.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsProcessing(true);
    try {
      const wallet = await WalletManager.importFromKeystore(
        keystoreJson.trim(),
        keystoreOldPassword,
        password,
      );
      setCreatedWallet(wallet);
      setMode('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import keystore');
    } finally {
      setIsProcessing(false);
    }
  }, [keystoreJson, keystoreOldPassword, password, confirmPassword]);

  const handleExportBackup = useCallback(async () => {
    if (!password) return;
    try {
      const json = await WalletManager.exportKeystore(password);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roil-wallet-${createdWallet?.displayName || 'backup'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setHasBackedUp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  }, [password, createdWallet]);

  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  const handleFinish = useCallback(() => {
    if (createdWallet) {
      onComplete(createdWallet);
    }
  }, [createdWallet, onComplete]);

  const resetForm = () => {
    setName('');
    setPassword('');
    setConfirmPassword('');
    setImportKey('');
    setKeystoreJson('');
    setKeystoreOldPassword('');
    setError(null);
    setShowPassword(false);
    setHasBackedUp(false);
  };

  // -----------------------------------------------------------------------
  // Common input classes (matching Login/SignUp style)
  // -----------------------------------------------------------------------

  const inputCls =
    'w-full rounded-xl border border-[#D6D9E3] bg-white px-[18px] py-[14px] text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669] disabled:opacity-60';
  const labelCls = 'mb-1.5 block text-sm font-medium text-[#111827]';
  const btnPrimary =
    'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#059669] to-[#10B981] py-[14px] text-sm font-semibold text-white shadow-[0_4px_16px_#05966930] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed';
  const btnSecondary =
    'flex w-full items-center justify-center gap-2 rounded-xl border border-[#D6D9E3] bg-white py-[14px] text-sm font-medium text-[#111827] transition hover:bg-[#F3F4F9] disabled:opacity-50 disabled:cursor-not-allowed';

  const strength = getPasswordStrength(password);

  // -----------------------------------------------------------------------
  // Render: Choose mode
  // -----------------------------------------------------------------------

  if (mode === 'choose') {
    return (
      <div className="w-full max-w-[520px] rounded-3xl border border-[#D6D9E3] bg-[#F3F4F9] px-10 py-9">
        {/* Close button */}
        <div className="flex justify-end -mt-2 -mr-2">
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#059669] to-[#10B981] shadow-lg">
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-[24px] font-[800] text-[#111827]">Set Up Your Wallet</h2>
          <p className="mt-1.5 text-sm text-[#6B7280]">
            Your Canton Network identity for Roil App
          </p>
        </div>

        {/* Google option */}
        {googleEnabled && (
          <div className="mb-4">
            <button
              onClick={handleGoogleWallet}
              disabled={isGoogleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#D6D9E3] bg-white px-5 py-[14px] text-sm font-medium text-[#111827] transition hover:bg-[#F3F4F9] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>

            {/* Error for Google */}
            {error && isGoogleLoading === false && mode === 'choose' && (
              <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
            )}

            {/* Divider */}
            <div className="mt-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#D6D9E3]" />
              <span className="text-xs text-[#6B7280]">Or create with password</span>
              <div className="h-px flex-1 bg-[#D6D9E3]" />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Passkey option — recommended when supported */}
          {isPasskeySupported() ? (
            <button
              onClick={() => { resetForm(); setMode('create-passkey'); }}
              className="flex w-full items-center gap-4 rounded-xl border border-[#059669] bg-[#F0FDF4] px-5 py-4 text-left transition hover:bg-[#ECFDF5]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#059669] to-[#10B981]">
                <Fingerprint className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#111827]">Sign in with Passkey</p>
                  <span className="rounded-full bg-[#059669] px-2 py-0.5 text-[10px] font-semibold text-white leading-none">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">Use fingerprint, Face ID, or device PIN</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-[#059669]" />
            </button>
          ) : (
            <div
              className="flex w-full items-center gap-4 rounded-xl border border-[#D6D9E3] bg-white px-5 py-4 text-left opacity-50 cursor-not-allowed"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6]">
                <Fingerprint className="h-5 w-5 text-[#9CA3AF]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#6B7280]">Sign in with Passkey</p>
                <p className="text-xs text-[#9CA3AF]">Not supported in this browser</p>
              </div>
            </div>
          )}

          <button
            onClick={() => { resetForm(); setMode('create'); }}
            className="flex w-full items-center gap-4 rounded-xl border border-[#D6D9E3] bg-white px-5 py-4 text-left transition hover:border-[#059669] hover:bg-[#F0FDF4]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECFDF5]">
              <Shield className="h-5 w-5 text-[#059669]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">Create New Wallet</p>
              <p className="text-xs text-[#6B7280]">Generate a new Ed25519 keypair</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={() => { resetForm(); setMode('import-key'); }}
            className="flex w-full items-center gap-4 rounded-xl border border-[#D6D9E3] bg-white px-5 py-4 text-left transition hover:border-[#059669] hover:bg-[#F0FDF4]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECFDF5]">
              <Key className="h-5 w-5 text-[#059669]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">Import Private Key</p>
              <p className="text-xs text-[#6B7280]">Restore from a hex-encoded private key</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={() => { resetForm(); setMode('import-keystore'); }}
            className="flex w-full items-center gap-4 rounded-xl border border-[#D6D9E3] bg-white px-5 py-4 text-left transition hover:border-[#059669] hover:bg-[#F0FDF4]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECFDF5]">
              <Upload className="h-5 w-5 text-[#059669]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">Import Keystore</p>
              <p className="text-xs text-[#6B7280]">Restore from an exported keystore JSON file</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-[#9CA3AF]" />
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Success
  // -----------------------------------------------------------------------

  if (mode === 'success' && createdWallet) {
    return (
      <div className="w-full max-w-[520px] rounded-3xl border border-[#D6D9E3] bg-[#F3F4F9] px-10 py-9">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5]">
            <Check className="h-7 w-7 text-[#059669]" />
          </div>
          <h2 className="text-[24px] font-[800] text-[#111827]">Wallet Created</h2>
          <p className="mt-1.5 text-sm text-[#6B7280]">
            Your Canton wallet is ready to use
          </p>
        </div>

        {/* Wallet info */}
        <div className="space-y-3 mb-6">
          {/* Display name */}
          <div className="rounded-xl border border-[#D6D9E3] bg-white px-4 py-3">
            <p className="text-xs text-[#6B7280] mb-1">Display Name</p>
            <p className="text-sm font-medium text-[#111827]">{createdWallet.displayName}</p>
          </div>

          {/* Party ID */}
          <div className="rounded-xl border border-[#D6D9E3] bg-white px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#6B7280]">Party ID</p>
              <button
                onClick={() => handleCopy(createdWallet.partyId, 'partyId')}
                className="flex items-center gap-1 text-xs text-[#059669] hover:text-[#047857] transition-colors"
              >
                {copiedField === 'partyId' ? (
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
            <p className="text-sm font-mono text-[#111827] break-all">{createdWallet.partyId}</p>
          </div>

          {/* Public Key */}
          <div className="rounded-xl border border-[#D6D9E3] bg-white px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#6B7280]">Public Key</p>
              <button
                onClick={() => handleCopy(createdWallet.publicKey, 'publicKey')}
                className="flex items-center gap-1 text-xs text-[#059669] hover:text-[#047857] transition-colors"
              >
                {copiedField === 'publicKey' ? (
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
            <p className="text-sm font-mono text-[#111827]">
              {truncateHex(createdWallet.publicKey)}
            </p>
          </div>
        </div>

        {/* Backup warning */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Back up your wallet</p>
              <p className="text-xs text-amber-700 mt-0.5">
                If you lose your password or clear browser data, your wallet cannot be recovered
                without a backup. Export your keystore now.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button onClick={handleExportBackup} className={btnSecondary}>
            <Download className="h-4 w-4" />
            {hasBackedUp ? 'Download Backup Again' : 'Download Backup Keystore'}
          </button>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <button onClick={handleFinish} className={btnPrimary}>
            {hasBackedUp ? 'Continue to App' : 'Skip Backup & Continue'}
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Create with Passkey
  // -----------------------------------------------------------------------

  if (mode === 'create-passkey') {
    return (
      <div className="w-full max-w-[520px] rounded-3xl border border-[#D6D9E3] bg-[#F3F4F9] px-10 py-9">
        {/* Back button */}
        <button
          onClick={() => { setMode('choose'); resetForm(); }}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#059669] to-[#10B981] shadow-lg">
            <Fingerprint className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-[24px] font-[800] text-[#111827]">Create with Passkey</h2>
          <p className="mt-1.5 text-sm text-[#6B7280]">
            Secure your wallet with fingerprint, Face ID, or device PIN
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Display name */}
          <div>
            <label className={labelCls}>Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alice, MyWallet, Treasury"
              disabled={isProcessing}
              className={inputCls}
            />
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Used in your Canton party ID: {name.trim() || 'name'}::1220...
            </p>
          </div>

          {/* Info box */}
          <div className="rounded-xl border border-[#D6D9E3] bg-white px-4 py-3">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-[#059669] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#111827]">No password needed</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Your wallet key is encrypted with your device's biometric sensor.
                  Only your fingerprint, Face ID, or device PIN can unlock it.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreateWithPasskey}
            disabled={isProcessing || !name.trim()}
            className={btnPrimary}
          >
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
            {isProcessing ? (
              'Waiting for biometric...'
            ) : (
              <>
                <Fingerprint className="h-4 w-4" />
                Create with Passkey
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Create / Import forms
  // -----------------------------------------------------------------------

  const isCreate = mode === 'create';
  const isImportKey = mode === 'import-key';
  const isImportKeystore = mode === 'import-keystore';

  const title = isCreate
    ? 'Create New Wallet'
    : isImportKey
      ? 'Import Private Key'
      : 'Import Keystore';

  const subtitle = isCreate
    ? 'Generate a fresh Ed25519 keypair for Canton Network'
    : isImportKey
      ? 'Restore your wallet from a hex-encoded private key'
      : 'Restore your wallet from a keystore backup file';

  const handleSubmit = isCreate
    ? handleCreate
    : isImportKey
      ? handleImportKey
      : handleImportKeystore;

  return (
    <div className="w-full max-w-[520px] rounded-3xl border border-[#D6D9E3] bg-[#F3F4F9] px-10 py-9">
      {/* Back button */}
      <button
        onClick={() => { setMode('choose'); resetForm(); }}
        className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <h2 className="text-[24px] font-[800] text-[#111827]">{title}</h2>
      <p className="mt-1.5 text-sm text-[#6B7280] mb-8">{subtitle}</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((step) => {
          const currentStep = isImportKeystore ? 3 : isImportKey ? 2 : 1;
          const total = isImportKeystore ? 3 : isImportKey ? 2 : 2;
          if (step > total) return null;
          return (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step <= currentStep ? 'bg-[#059669]' : 'bg-[#D6D9E3]'
              }`}
            />
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Import-specific fields */}
        {isImportKey && (
          <div>
            <label className={labelCls}>Private Key (hex)</label>
            <input
              type="password"
              value={importKey}
              onChange={(e) => setImportKey(e.target.value)}
              placeholder="64-character hex string (32 bytes)"
              disabled={isProcessing}
              className={`${inputCls} font-mono text-xs`}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        )}

        {isImportKeystore && (
          <>
            <div>
              <label className={labelCls}>Keystore JSON</label>
              <textarea
                value={keystoreJson}
                onChange={(e) => setKeystoreJson(e.target.value)}
                placeholder='Paste your keystore JSON here, or drag & drop the file'
                disabled={isProcessing}
                className={`${inputCls} min-h-[100px] resize-y font-mono text-xs`}
                spellCheck={false}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const text = await file.text();
                    setKeystoreJson(text);
                  }
                }}
              />
            </div>
            <div>
              <label className={labelCls}>Keystore Password</label>
              <input
                type="password"
                value={keystoreOldPassword}
                onChange={(e) => setKeystoreOldPassword(e.target.value)}
                placeholder="Password used to encrypt the keystore"
                disabled={isProcessing}
                className={inputCls}
              />
            </div>
          </>
        )}

        {/* Display name (for create and import-key modes) */}
        {(isCreate || isImportKey) && (
          <div>
            <label className={labelCls}>Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alice, MyWallet, Treasury"
              disabled={isProcessing}
              className={inputCls}
            />
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Used in your Canton party ID: {name.trim() || 'name'}::1220...
            </p>
          </div>
        )}

        {/* Password */}
        <div>
          <label className={labelCls}>
            {isImportKeystore ? 'New Password' : 'Password'}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              disabled={isProcessing}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
            >
              {showPassword ? (
                <Eye className="h-[18px] w-[18px]" />
              ) : (
                <EyeOff className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>

          {/* Password strength indicator */}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      level <= strength.score ? strength.color : 'bg-[#E5E7EB]'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-[#6B7280]">
                Strength: <span className="font-medium">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className={labelCls}>
            {isImportKeystore ? 'Confirm New Password' : 'Confirm Password'}
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            disabled={isProcessing}
            className={inputCls}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isProcessing || password.length < 8 || password !== confirmPassword}
          className={btnPrimary}
        >
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
          {isProcessing
            ? 'Processing...'
            : isCreate
              ? 'Create Wallet'
              : 'Import Wallet'}
        </button>
      </div>
    </div>
  );
}
