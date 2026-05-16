import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';

/**
 * BridgeEducation — collapsible explainer card describing the xReserve
 * lock-and-mint mechanism. Shown below the form/history; defaults to
 * collapsed so it does not push the primary action below the fold.
 */

export default function BridgeEducation() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-[#F8F9FB] dark:hover:bg-slate-700/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-[#059669]" />
          <span className="text-sm font-semibold text-[#111827] dark:text-slate-100">
            How the xReserve bridge works
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#6B7280] dark:text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 pt-1 space-y-3 text-sm text-[#6B7280] dark:text-slate-400 leading-relaxed">
          <p>
            xReserve is Circle&apos;s permissioned lock-and-mint bridge for USDC
            between Ethereum and Canton Network. Roil routes deposits and
            withdrawals through xReserve so liquidity always stays in regulated
            channels.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-[#D6D9E3] dark:border-slate-700 p-4">
              <p className="text-xs font-semibold text-[#059669] uppercase tracking-wide mb-1">
                Deposit
              </p>
              <p className="text-sm text-[#111827] dark:text-slate-100 font-medium mb-1">
                Ethereum USDC → Canton USDCx
              </p>
              <ol className="text-xs space-y-1 list-decimal list-inside">
                <li>Approve xReserve to spend USDC on Ethereum.</li>
                <li>Lock USDC; ~13&ndash;15 min for finality.</li>
                <li>Operator attests on Canton.</li>
                <li>Mint USDCx into your Canton wallet.</li>
              </ol>
            </div>

            <div className="rounded-xl border border-[#D6D9E3] dark:border-slate-700 p-4">
              <p className="text-xs font-semibold text-[#059669] uppercase tracking-wide mb-1">
                Withdraw
              </p>
              <p className="text-sm text-[#111827] dark:text-slate-100 font-medium mb-1">
                Canton USDCx → Ethereum USDC
              </p>
              <ol className="text-xs space-y-1 list-decimal list-inside">
                <li>Burn USDCx on Canton with the destination address.</li>
                <li>Operator releases USDC on Ethereum, typically minutes.</li>
                <li>USDC settles in the destination wallet.</li>
              </ol>
            </div>
          </div>

          <p className="text-xs pt-2">
            One-time onboarding creates a <em>BridgeUserAgreement</em> contract
            on Canton; after that, individual transfers are permissionless.
          </p>
        </div>
      )}
    </div>
  );
}
