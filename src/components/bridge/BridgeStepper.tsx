import { Check, Loader2 } from 'lucide-react';
import type { DepositStatus, WithdrawState } from '@/hooks/useXReserve';

/**
 * BridgeStepper — visual progress for an in-flight deposit or withdraw.
 *
 * Deposit (Ethereum → Canton) has 5 stages:
 *   approve → burn → finality → attestation → mint
 * Withdraw (Canton → Ethereum) has 3 stages:
 *   burn → release → settled
 */

type Step = {
  key: string;
  label: string;
  hint?: string;
};

const DEPOSIT_STEPS: Step[] = [
  { key: 'approving', label: 'Approve', hint: 'Authorise xReserve to move your USDC' },
  { key: 'burning', label: 'Lock', hint: 'Submit on Ethereum' },
  { key: 'awaiting_finality', label: 'Confirm', hint: '~13–15 min for Ethereum finality' },
  { key: 'awaiting_attestation', label: 'Attest', hint: 'Operator signs the deposit' },
  { key: 'claiming', label: 'Mint USDCx', hint: 'Receive on Canton' },
];

const WITHDRAW_STEPS: Step[] = [
  { key: 'burning', label: 'Burn USDCx', hint: 'Submit on Canton' },
  { key: 'awaiting_release', label: 'Release', hint: 'Operator unlocks USDC on Ethereum' },
  { key: 'settled', label: 'Settled', hint: 'USDC delivered to your wallet' },
];

type Phase = 'pending' | 'active' | 'done';

function depositPhase(currentStatus: DepositStatus, stepKey: string): Phase {
  const order: DepositStatus[] = [
    'idle',
    'onboarding',
    'connecting',
    'checking_allowance',
    'approving',
    'burning',
    'awaiting_finality',
    'awaiting_attestation',
    'attested',
    'claiming',
    'completed',
  ];
  const currentIdx = order.indexOf(currentStatus);
  const stepIdx = order.indexOf(stepKey as DepositStatus);
  if (currentStatus === 'completed') return 'done';
  if (currentStatus === 'failed') return stepIdx < currentIdx ? 'done' : 'pending';
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  // Special case: 'attested' is between awaiting_attestation and claiming.
  // Treat the claim step as active when status is 'attested' so the user
  // is nudged to press the claim button.
  if (currentStatus === 'attested' && stepKey === 'claiming') return 'active';
  return 'pending';
}

function withdrawPhase(state: WithdrawState['status'], stepKey: string): Phase {
  const order = ['idle', 'burning', 'awaiting_release', 'completed'];
  const currentIdx = order.indexOf(state);
  const stepIdx =
    stepKey === 'settled' ? order.indexOf('completed') : order.indexOf(stepKey);
  if (state === 'completed') return 'done';
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

interface Props {
  direction: 'deposit' | 'withdraw';
  depositStatus?: DepositStatus;
  withdrawStatus?: WithdrawState['status'];
  failed?: boolean;
  error?: string;
}

export default function BridgeStepper({
  direction,
  depositStatus,
  withdrawStatus,
  failed,
  error,
}: Props) {
  const steps = direction === 'deposit' ? DEPOSIT_STEPS : WITHDRAW_STEPS;

  return (
    <div className="bg-white dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-[#111827] dark:text-slate-100">
          Transfer progress
        </h3>
        {failed && (
          <span className="text-xs font-medium text-[#E11D48] bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-2 py-1 rounded-md">
            Failed
          </span>
        )}
      </div>

      <ol className="relative">
        {steps.map((step, i) => {
          const phase =
            direction === 'deposit'
              ? depositPhase(depositStatus ?? 'idle', step.key)
              : withdrawPhase(withdrawStatus ?? 'idle', step.key);
          const isLast = i === steps.length - 1;

          return (
            <li key={step.key} className="flex gap-3 pb-5 last:pb-0 relative">
              {/* Connector line */}
              {!isLast && (
                <span
                  aria-hidden
                  className={`absolute left-[15px] top-8 bottom-0 w-px ${
                    phase === 'done'
                      ? 'bg-[#059669]'
                      : 'bg-[#D6D9E3] dark:bg-slate-700'
                  }`}
                />
              )}

              {/* Indicator circle */}
              <div
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                  phase === 'done'
                    ? 'bg-[#059669] text-white'
                    : phase === 'active'
                    ? 'bg-white dark:bg-slate-900 border-2 border-[#059669] text-[#059669]'
                    : 'bg-[#F3F4F9] dark:bg-slate-900 border border-[#D6D9E3] dark:border-slate-700 text-[#9CA3AF]'
                }`}
              >
                {phase === 'done' ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : phase === 'active' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
              </div>

              {/* Text */}
              <div className="pt-1">
                <p
                  className={`text-sm font-medium ${
                    phase === 'pending'
                      ? 'text-[#9CA3AF] dark:text-slate-500'
                      : 'text-[#111827] dark:text-slate-100'
                  }`}
                >
                  {step.label}
                </p>
                {step.hint && (
                  <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
                    {step.hint}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {failed && error && (
        <div className="mt-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-[#E11D48] dark:text-red-400 break-words">
          {error}
        </div>
      )}
    </div>
  );
}
