import { useState, useEffect } from 'react';
import { ArrowRight, Coins, ShieldCheck, Clock } from 'lucide-react';
import { useParty } from '@/context/PartyContext';
import { useXReserveDeposit, useXReserveWithdraw } from '@/hooks/useXReserve';
import { useBridgeHistory } from '@/hooks/useBridgeHistory';
import BridgeForm from '@/components/bridge/BridgeForm';
import BridgeStepper from '@/components/bridge/BridgeStepper';
import BridgeHistory from '@/components/bridge/BridgeHistory';
import BridgeEducation from '@/components/bridge/BridgeEducation';

/**
 * Bridge page — full-flow USDC ↔ USDCx bridge experience.
 *
 * Replaces the modal-only flow embedded in /wallet with a dedicated route
 * that shows: hero card with direction + balances, the actual transfer
 * form, a live status stepper (only while a transfer is in flight), the
 * user's complete bridge history, and an explainer about the underlying
 * Circle xReserve mechanism.
 *
 * Only USDC ↔ USDCx is supported today (the only Canton bridge live in
 * production). The layout is intentionally extensible so additional
 * bridged assets can drop in as the ecosystem grows.
 */

export default function Bridge() {
  const { party } = useParty();
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit');
  const [showStepper, setShowStepper] = useState(false);

  // Share state with the form via the same singleton hooks — the form
  // calls deposit()/withdraw() and we observe progress here for the
  // stepper and the post-completion history refresh.
  const { state: depositState } = useXReserveDeposit();
  const { state: withdrawState } = useXReserveWithdraw();
  const { entries, isLoading, error, refresh } = useBridgeHistory(!!party);

  const activeStatus =
    direction === 'deposit' ? depositState.status : withdrawState.status;
  const activeError =
    direction === 'deposit' ? depositState.error : withdrawState.error;
  const isTerminal =
    activeStatus === 'completed' || activeStatus === 'failed';

  // Pull history once a transfer enters a terminal state so the table
  // immediately reflects the latest deposit/withdraw without a manual refresh.
  useEffect(() => {
    if (showStepper && isTerminal) {
      refresh();
    }
  }, [showStepper, isTerminal, refresh]);

  return (
    <div className="flex flex-col gap-6 font-['DM_Sans'] max-w-5xl mx-auto w-full">
      {/* -------------------------------------------------------------- */}
      {/* Header                                                          */}
      {/* -------------------------------------------------------------- */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] dark:text-slate-100 leading-tight">
            USDC Bridge
          </h1>
          <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-1 max-w-xl">
            Move USDC between Ethereum and Canton through Circle&apos;s xReserve
            lock-and-mint bridge. Deposits arrive as USDCx; withdrawals settle
            back to native USDC.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/40 text-[#059669] dark:text-green-300 self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
          xReserve operator online
        </span>
      </header>

      {/* -------------------------------------------------------------- */}
      {/* Hero — flow visual                                              */}
      {/* -------------------------------------------------------------- */}
      <section className="bg-gradient-to-br from-[#F8FAFC] to-[#ECFDF5] dark:from-slate-900 dark:to-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-2xl p-6">
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-2 bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center">
              <Coins className="w-7 h-7 text-blue-600 dark:text-blue-300" />
            </div>
            <p className="text-xs text-[#6B7280] dark:text-slate-400 uppercase tracking-wide">
              Ethereum
            </p>
            <p className="text-sm font-semibold text-[#111827] dark:text-slate-100 mt-0.5">
              USDC
            </p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <ArrowRight
              className={`w-6 h-6 ${
                direction === 'deposit'
                  ? 'text-[#059669]'
                  : 'text-[#9CA3AF] rotate-180'
              } transition-transform`}
            />
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">
              xReserve
            </span>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-2 bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center">
              <Coins className="w-7 h-7 text-[#059669]" />
            </div>
            <p className="text-xs text-[#6B7280] dark:text-slate-400 uppercase tracking-wide">
              Canton
            </p>
            <p className="text-sm font-semibold text-[#111827] dark:text-slate-100 mt-0.5">
              USDCx
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6 text-xs">
          <div className="flex items-center gap-2 text-[#6B7280] dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>Permissioned lock-and-mint</span>
          </div>
          <div className="flex items-center gap-2 text-[#6B7280] dark:text-slate-400 justify-center">
            <Clock className="w-4 h-4 text-[#059669]" />
            <span>~13 min deposit, ~5 min withdraw</span>
          </div>
          <div className="flex items-center gap-2 text-[#6B7280] dark:text-slate-400 justify-end">
            <Coins className="w-4 h-4 text-[#059669]" />
            <span>1 USDC = 1 USDCx, 1:1 backed</span>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* Form + (conditional) stepper                                    */}
      {/* -------------------------------------------------------------- */}
      <section
        className={`grid gap-6 ${
          showStepper ? 'lg:grid-cols-[1fr,360px]' : 'lg:grid-cols-1'
        }`}
      >
        <BridgeForm
          direction={direction}
          onDirectionChange={setDirection}
          onTransferStart={() => setShowStepper(true)}
        />
        {showStepper && (
          <BridgeStepper
            direction={direction}
            depositStatus={direction === 'deposit' ? depositState.status : undefined}
            withdrawStatus={
              direction === 'withdraw' ? withdrawState.status : undefined
            }
            failed={activeStatus === 'failed'}
            error={activeError}
          />
        )}
      </section>

      {/* -------------------------------------------------------------- */}
      {/* History                                                         */}
      {/* -------------------------------------------------------------- */}
      <BridgeHistory
        entries={entries}
        isLoading={isLoading}
        error={error}
        onRefresh={refresh}
      />

      {/* -------------------------------------------------------------- */}
      {/* Education                                                       */}
      {/* -------------------------------------------------------------- */}
      <BridgeEducation />
    </div>
  );
}
