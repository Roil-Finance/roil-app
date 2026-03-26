import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Copy,
  Users,
  Shield,
  Loader2,
  AlertCircle,
  Gift,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useParty } from '@/context/PartyContext';
import { useQuery, useMutation } from '@/hooks/useApi';
import { useToast } from '@/components/Toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhitelistStatus {
  isWhitelisted: boolean;
  joinedAt?: string;
  dailyLimit?: number;
  inviteCodesRemaining?: number;
}

interface WhitelistStats {
  totalSpots: number;
  spotsTaken: number;
}

interface InviteCode {
  code: string;
  createdAt: string;
  usedBy?: string;
  isUsed: boolean;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_STATUS: WhitelistStatus = {
  isWhitelisted: false,
};

const MOCK_STATUS_WHITELISTED: WhitelistStatus = {
  isWhitelisted: true,
  joinedAt: '2026-03-20T10:30:00Z',
  dailyLimit: 50,
  inviteCodesRemaining: 3,
};

const MOCK_STATS: WhitelistStats = {
  totalSpots: 1000,
  spotsTaken: 847,
};

const MOCK_INVITE_CODES: InviteCode[] = [
  { code: 'ROIL-A7X9K2', createdAt: '2026-03-20T10:30:00Z', isUsed: false },
  { code: 'ROIL-M3P5Q8', createdAt: '2026-03-20T10:30:00Z', isUsed: false },
  { code: 'ROIL-Z1W4R6', createdAt: '2026-03-20T10:30:00Z', usedBy: 'alice::Canton', isUsed: true },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Whitelist() {
  const { party } = useParty();
  const { addToast } = useToast();

  // Queries
  const { data: statusData, refetch: refetchStatus } = useQuery<WhitelistStatus>(
    party ? `/api/whitelist/status?party=${encodeURIComponent(party)}` : null,
  );
  const { data: statsData } = useQuery<WhitelistStats>('/api/whitelist/stats');
  const { data: inviteCodes } = useQuery<InviteCode[]>(
    party ? `/api/whitelist/invite-codes?party=${encodeURIComponent(party)}` : null,
  );

  // Mutations
  const { mutate: joinWhitelist, isLoading: isJoining, error: joinError } = useMutation<
    { party: string; email?: string; inviteCode?: string },
    { success: boolean }
  >('/api/whitelist/join');

  const { mutate: redeemCode, isLoading: isRedeeming, error: redeemError } = useMutation<
    { party: string; code: string },
    { success: boolean }
  >('/api/whitelist/redeem');

  // Use mock data as fallback
  const stats = statsData ?? MOCK_STATS;
  // For demo: toggle between whitelisted/not based on party existence
  const status = statusData ?? (party ? MOCK_STATUS_WHITELISTED : MOCK_STATUS);
  const codes = inviteCodes ?? (status.isWhitelisted ? MOCK_INVITE_CODES : []);

  // Form state
  const [email, setEmail] = useState('');
  const [redeemInput, setRedeemInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Progress
  const progressPct = Math.min((stats.spotsTaken / stats.totalSpots) * 100, 100);
  const spotsRemaining = Math.max(stats.totalSpots - stats.spotsTaken, 0);

  // Copy invite code
  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      addToast('success', 'Invite code copied to clipboard');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      addToast('error', 'Failed to copy');
    }
  };

  // Join whitelist
  const handleJoin = async () => {
    if (!party) {
      addToast('error', 'Please create or unlock your wallet first');
      return;
    }
    try {
      await joinWhitelist({ party, email: email || undefined });
      addToast('success', 'Welcome to Roil Beta!');
      refetchStatus();
    } catch {
      addToast('error', joinError ?? 'Failed to join whitelist');
    }
  };

  // Redeem invite code
  const handleRedeem = async () => {
    if (!party || !redeemInput.trim()) return;
    try {
      await redeemCode({ party, code: redeemInput.trim() });
      addToast('success', 'Invite code redeemed! You are now whitelisted.');
      setRedeemInput('');
      refetchStatus();
    } catch {
      addToast('error', redeemError ?? 'Invalid or expired invite code');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#1A1A2E] dark:text-slate-100">
          Roil Beta Access
        </h2>
        <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-1">
          Early access to Treasury Swap on Canton Network
        </p>
      </div>

      {/* Stats bar */}
      <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-[18px_22px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#059669]" />
            <span className="text-sm font-semibold text-[#1A1A2E] dark:text-slate-100">
              Beta Spots
            </span>
          </div>
          <span className="text-sm font-bold text-[#1A1A2E] dark:text-slate-100">
            {stats.spotsTaken.toLocaleString()} / {stats.totalSpots.toLocaleString()}
          </span>
        </div>
        <div className="w-full h-3 bg-[#E5E7EB] dark:bg-slate-600 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(135deg, #059669, #10B981)',
            }}
          />
        </div>
        <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-2">
          {spotsRemaining} spots remaining
        </p>
      </div>

      {/* Main content */}
      {status.isWhitelisted ? (
        /* ============ WHITELISTED VIEW ============ */
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Status card */}
          <div className="flex-1">
            <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-[18px_22px]">
              {/* Success badge */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-[#E0F5EA] flex items-center justify-center">
                  <Check className="w-6 h-6 text-[#059669]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#1A1A2E] dark:text-slate-100">
                      You're in!
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E0F5EA] text-[#059669]">
                      Whitelisted
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
                    Beta member since{' '}
                    {status.joinedAt
                      ? new Date(status.joinedAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'recently'}
                  </p>
                </div>
              </div>

              {/* Status details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white dark:bg-slate-700 border border-[#D6D9E3] dark:border-slate-600 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#6B7280]" />
                    <span className="text-xs text-[#6B7280] dark:text-slate-400">Daily Swap Limit</span>
                  </div>
                  <span className="text-sm font-bold text-[#059669]">
                    ${status.dailyLimit ?? 50}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-700 border border-[#D6D9E3] dark:border-slate-600 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#6B7280]" />
                    <span className="text-xs text-[#6B7280] dark:text-slate-400">Invite Codes Remaining</span>
                  </div>
                  <span className="text-sm font-bold text-[#1A1A2E] dark:text-slate-100">
                    {status.inviteCodesRemaining ?? codes.filter((c) => !c.isUsed).length}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-700 border border-[#D6D9E3] dark:border-slate-600 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#6B7280]" />
                    <span className="text-xs text-[#6B7280] dark:text-slate-400">Party ID</span>
                  </div>
                  <span className="text-xs font-mono text-[#6B7280] dark:text-slate-400 truncate max-w-[200px]">
                    {party || 'N/A'}
                  </span>
                </div>
              </div>

              {/* CTA to swap */}
              <Link
                to="/swap"
                className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
              >
                Go to Swap
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right: Invite codes */}
          <div className="flex-1">
            <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-[18px_22px]">
              <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-slate-100 mb-1">
                Share with Friends
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-slate-400 mb-4">
                Each code gives one friend access to Roil Beta. Share them wisely.
              </p>

              <div className="space-y-3">
                {codes.map((invite) => (
                  <div
                    key={invite.code}
                    className={`flex items-center justify-between bg-white dark:bg-slate-700 border rounded-xl px-4 py-3 ${
                      invite.isUsed
                        ? 'border-[#E5E7EB] dark:border-slate-600 opacity-60'
                        : 'border-[#D6D9E3] dark:border-slate-600'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-mono font-semibold text-[#1A1A2E] dark:text-slate-100">
                        {invite.code}
                      </p>
                      {invite.isUsed ? (
                        <p className="text-[10px] text-[#6B7280] dark:text-slate-400 mt-0.5">
                          Used by {invite.usedBy?.split('::')[0] ?? 'someone'}
                        </p>
                      ) : (
                        <p className="text-[10px] text-[#059669] mt-0.5">Available</p>
                      )}
                    </div>

                    {invite.isUsed ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#E5E7EB] dark:bg-slate-600 text-[#6B7280] dark:text-slate-400">
                        Used
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCopy(invite.code)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E0F5EA] dark:bg-emerald-900/30 text-[#059669] hover:bg-[#D1F0E0] dark:hover:bg-emerald-900/50 transition-colors"
                      >
                        {copiedCode === invite.code ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Share tip */}
              <div className="mt-4 bg-[#DBEAFE] dark:bg-blue-900/20 border border-[#93C5FD] dark:border-blue-800 rounded-xl px-4 py-3">
                <p className="text-xs text-[#2563EB] dark:text-blue-300">
                  <strong>Tip:</strong> When your invited friends trade, you both earn bonus CC rewards.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============ NOT WHITELISTED VIEW ============ */
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Join form */}
          <div className="flex-1">
            <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-[18px_22px]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-[#E0F5EA] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#059669]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A2E] dark:text-slate-100">
                    Join the Whitelist
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-slate-400">
                    Get early access to Treasury Swap
                  </p>
                </div>
              </div>

              {/* Error */}
              {joinError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {joinError}
                </div>
              )}

              {/* Party ID (auto-filled) */}
              <div className="mb-4">
                <label className="block text-xs text-[#6B7280] dark:text-slate-400 mb-1.5">
                  Party ID
                </label>
                <input
                  type="text"
                  value={party || ''}
                  readOnly
                  placeholder="Create a wallet first"
                  className="w-full bg-white dark:bg-slate-700 border border-[#D6D9E3] dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-[#1A1A2E] dark:text-slate-100 focus:outline-none opacity-70 cursor-not-allowed"
                />
              </div>

              {/* Email (optional) */}
              <div className="mb-4">
                <label className="block text-xs text-[#6B7280] dark:text-slate-400 mb-1.5">
                  Email <span className="text-[#9CA3AF]">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white dark:bg-slate-700 border border-[#D6D9E3] dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-[#1A1A2E] dark:text-slate-100 placeholder:text-[#D1D5DB] dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                />
                <p className="text-[10px] text-[#9CA3AF] dark:text-slate-500 mt-1">
                  Get notified about limit increases and new features
                </p>
              </div>

              {/* Join button */}
              <button
                onClick={handleJoin}
                disabled={isJoining || !party}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining...
                  </>
                ) : !party ? (
                  'Create a Wallet First'
                ) : (
                  'Join Whitelist'
                )}
              </button>

              {!party && (
                <Link
                  to="/wallet"
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-[#059669] border border-[#059669] hover:bg-[#E0F5EA] dark:hover:bg-emerald-900/20 transition-colors"
                >
                  Create Wallet
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Right: Redeem invite code */}
          <div className="flex-1">
            <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-[18px_22px]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                  <Gift className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A2E] dark:text-slate-100">
                    Have an Invite Code?
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-slate-400">
                    Skip the line with a friend's code
                  </p>
                </div>
              </div>

              {/* Redeem error */}
              {redeemError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {redeemError}
                </div>
              )}

              {/* Code input */}
              <div className="mb-4">
                <label className="block text-xs text-[#6B7280] dark:text-slate-400 mb-1.5">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={redeemInput}
                  onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
                  placeholder="ROIL-XXXXXX"
                  className="w-full bg-white dark:bg-slate-700 border border-[#D6D9E3] dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-mono text-[#1A1A2E] dark:text-slate-100 placeholder:text-[#D1D5DB] dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] tracking-wider"
                />
              </div>

              {/* Redeem button */}
              <button
                onClick={handleRedeem}
                disabled={isRedeeming || !party || !redeemInput.trim()}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redeeming...
                  </>
                ) : (
                  'Redeem Code'
                )}
              </button>
            </div>

            {/* Benefits card */}
            <div className="mt-4 bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-[18px_22px]">
              <h4 className="text-sm font-semibold text-[#1A1A2E] dark:text-slate-100 mb-3">
                Beta Benefits
              </h4>
              <div className="space-y-2.5">
                {[
                  'Treasury swap at 0.5% spread',
                  '$50 daily swap limit',
                  '3 invite codes to share',
                  'CC rewards on every trade',
                  'Early access to new features',
                ].map((benefit) => (
                  <div key={benefit} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                    <span className="text-xs text-[#6B7280] dark:text-slate-400">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
