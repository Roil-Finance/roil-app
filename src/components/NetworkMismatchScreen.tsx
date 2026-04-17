/**
 * Full-screen blocker rendered when the frontend and backend disagree about
 * which Canton network is in use. Purely informational — refuses to let the
 * user transact until an operator rebuilds the frontend with the correct
 * `VITE_NETWORK` or redeploys the backend.
 */
import { config } from '../config';

interface Props {
  backendNetwork: string;
}

export default function NetworkMismatchScreen({ backendNetwork }: Props) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-red-950 text-white p-8">
      <div className="max-w-xl text-center space-y-4">
        <div className="text-sm uppercase tracking-wide text-red-300">
          Network mismatch — transactions disabled
        </div>
        <h1 className="text-3xl font-semibold">
          Frontend and backend disagree about which network is live
        </h1>
        <div className="text-red-100 space-y-2">
          <p>
            The frontend was built for <strong>{config.network}</strong>, but the
            backend at <code>{config.backendUrl}</code> reports it is running on{' '}
            <strong>{backendNetwork}</strong>.
          </p>
          <p className="text-sm opacity-80">
            Transacting while these values disagree would broadcast transactions
            on the wrong ledger. Reload after the operator has rebuilt the
            frontend with the matching <code>VITE_NETWORK</code> or pointed{' '}
            <code>VITE_BACKEND_URL</code> at the correct backend.
          </p>
        </div>
      </div>
    </div>
  );
}
