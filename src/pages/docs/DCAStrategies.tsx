import { Clock, Pause, Play, XCircle } from 'lucide-react';

const FREQUENCIES = [
  { name: 'Hourly', interval: 'Every hour', monthly: '~720 executions', best: 'High-frequency accumulation, volatile markets' },
  { name: 'Daily', interval: 'Every 24 hours', monthly: '~30 executions', best: 'Regular accumulation with moderate frequency' },
  { name: 'Weekly', interval: 'Every 7 days', monthly: '~4 executions', best: 'Standard DCA strategy, balanced approach' },
  { name: 'Monthly', interval: 'Every 30 days', monthly: '1 execution', best: 'Long-term accumulation, low maintenance' },
];

export default function DCAStrategies() {
  return (
    <div>
      <h1 className="text-[32px] lg:text-[36px] font-bold text-[#111827] dark:text-slate-100 mb-3">
        DCA Strategies
      </h1>
      <p className="text-[16px] text-[#6B7280] dark:text-slate-400 leading-relaxed mb-10 max-w-[640px]">
        Dollar-Cost Averaging (DCA) lets you schedule recurring purchases of target assets, reducing
        the impact of volatility through consistent, automated buying.
      </p>

      {/* Creating DCA */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Creating a DCA Schedule
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-6">
          A DCA schedule defines a source asset (what you spend), a target asset (what you buy),
          an amount per execution, and a frequency. The system creates a Daml
          <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">DCASchedule</code> contract
          on the Canton ledger.
        </p>

        <div className="bg-[#1E293B] rounded-lg p-4 mb-6 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`POST /api/dca

{
  "user": "alice::abc123...",
  "sourceAsset": { "symbol": "USDCx", "admin": "Canton::Admin" },
  "targetAsset": { "symbol": "CBTC", "admin": "Canton::Admin" },
  "amountPerBuy": 100,
  "frequency": "Weekly"
}

// Response:
{
  "success": true,
  "data": {
    "contractId": "00c4a1...",
    "user": "alice::abc123...",
    "sourceAsset": "USDCx",
    "targetAsset": "CBTC",
    "amountPerBuy": 100,
    "frequency": "Weekly"
  }
}`}
          </pre>
        </div>

        <div className="bg-[#F0FDF4] dark:bg-emerald-900/20 border border-[#BBF7D0] dark:border-emerald-800 rounded-xl p-5">
          <p className="text-[14px] text-[#059669] dark:text-emerald-400 leading-relaxed">
            <strong>Validation:</strong> Source and target assets must be different. Amount must be positive.
            The user must have sufficient source asset balance for each execution.
          </p>
        </div>
      </section>

      {/* Frequencies */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Frequencies
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-slate-700">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F8F9FB] dark:bg-slate-800 border-b border-[#E5E7EB] dark:border-slate-700">
                <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Frequency</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Interval</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Monthly Buys</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Best For</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {FREQUENCIES.map((f, i) => (
                <tr
                  key={f.name}
                  className={`border-b border-[#E5E7EB] dark:border-slate-700 ${i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-[#FAFBFC] dark:bg-slate-800/30'}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#059669] dark:text-emerald-400" />
                      <span className="font-medium text-[#111827] dark:text-slate-200">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400">{f.interval}</td>
                  <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400 font-mono">{f.monthly}</td>
                  <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400">{f.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[14px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
          You can change the frequency of an active schedule at any time via
          <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">PUT /api/dca/:id/frequency</code>.
          The update amount endpoint is
          <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">PUT /api/dca/:id/amount</code>.
        </p>
      </section>

      {/* Lifecycle */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Pause / Resume / Cancel
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-6">
          DCA schedules support full lifecycle management through Daml contract choices:
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="w-9 h-9 rounded-lg bg-[#FEF3C7] dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Pause className="w-4 h-4 text-[#D97706] dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 mb-1">Pause</h3>
              <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
                <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">POST /api/dca/:id/pause</code> &mdash;
                Suspends automatic execution. The schedule remains on the ledger but no new buys are triggered.
                Returns an error if already paused.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="w-9 h-9 rounded-lg bg-[#E0F5EA] dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 text-[#059669] dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 mb-1">Resume</h3>
              <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
                <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">POST /api/dca/:id/resume</code> &mdash;
                Reactivates a paused schedule. Execution resumes at the next scheduled interval.
                Returns an error if already active.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="w-9 h-9 rounded-lg bg-[#FEE2E2] dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4 text-[#EF4444] dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 mb-1">Cancel</h3>
              <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
                <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">DELETE /api/dca/:id</code> &mdash;
                Permanently cancels (archives) the schedule. The Daml contract is exercised with the
                <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">CancelDCA</code> choice.
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Execution History */}
      <section>
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Execution History
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Each DCA execution creates a <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">DCALog</code> contract
          on the Canton ledger. Query execution history for a specific schedule via
          <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">GET /api/dca/:id/history</code>.
        </p>

        <div className="bg-[#1E293B] rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`// DCALog contract payload
{
  "platform": "roil::abc123...",
  "user": "alice::def456...",
  "sourceAsset": { "symbol": "USDCx", "admin": "Canton::Admin" },
  "targetAsset": { "symbol": "CBTC", "admin": "Canton::Admin" },
  "sourceAmount": 100,
  "targetAmount": 0.00115,
  "executionNumber": 12,
  "timestamp": "2026-03-25T09:00:00Z"
}

// The schedule's totalExecutions counter is incremented after each run.
// Full history shows a cumulative view of all executions for the schedule.`}
          </pre>
        </div>
      </section>
    </div>
  );
}
