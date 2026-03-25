import { Fingerprint, Mail, KeyRound, ShieldCheck } from 'lucide-react';

const AUTH_METHODS = [
  {
    icon: Fingerprint,
    name: 'Passkey (WebAuthn)',
    security: 'Highest',
    color: 'bg-[#059669]',
    description: 'Uses your device\'s biometric capabilities (fingerprint, Face ID, or hardware security key) to create a cryptographic credential. No password is ever transmitted to the server.',
    flow: [
      'Click "Sign in with Passkey"',
      'Browser prompts for biometric verification',
      'Device generates an Ed25519 keypair bound to roil.app',
      'Public key is registered with the server',
      'Subsequent logins use the same biometric + stored credential',
    ],
  },
  {
    icon: Mail,
    name: 'Google OAuth 2.0',
    security: 'High',
    color: 'bg-[#2563EB]',
    description: 'Delegates authentication to Google\'s identity provider. Roil receives a signed JWT from Google confirming your identity, then provisions a Canton party for your account.',
    flow: [
      'Click "Sign in with Google"',
      'Redirect to Google\'s OAuth consent screen',
      'Google returns a signed ID token to Roil',
      'Server verifies the token signature and extracts email',
      'Canton party provisioned (or existing party returned)',
    ],
  },
  {
    icon: Mail,
    name: 'Email + OTP',
    security: 'High',
    color: 'bg-[#7C3AED]',
    description: 'Passwordless authentication via email. A 6-digit one-time code is sent to your email address. The code expires after 10 minutes and can only be used once.',
    flow: [
      'Enter your email address',
      'Server sends a 6-digit OTP to your inbox',
      'Enter the code within 10 minutes',
      'Server verifies code and issues a JWT session',
      'Canton party provisioned on first login',
    ],
  },
  {
    icon: KeyRound,
    name: 'Email + Password',
    security: 'Standard',
    color: 'bg-[#D97706]',
    description: 'Traditional authentication with client-side password hashing. Your raw password never leaves the browser. PBKDF2 with 100,000 iterations is applied before transmission.',
    flow: [
      'Enter email and password',
      'Client hashes password: PBKDF2(password, email_salt, 100000, SHA-256)',
      'Only the derived hash is sent to the server',
      'Server applies bcrypt on the derived hash for storage',
      'JWT issued on successful verification',
    ],
  },
];

export default function CreateWallet() {
  return (
    <div>
      <h1 className="text-[32px] lg:text-[36px] font-bold text-[#111827] dark:text-slate-100 mb-3">
        Create Your Wallet
      </h1>
      <p className="text-[16px] text-[#6B7280] dark:text-slate-400 leading-relaxed mb-10 max-w-[640px]">
        Roil Finance supports multiple authentication methods, each generating a Canton Network party
        and an Ed25519 keypair for signing ledger transactions.
      </p>

      {/* Auth methods */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-6">
          Authentication Methods
        </h2>
        <div className="space-y-6">
          {AUTH_METHODS.map((method) => (
            <div
              key={method.name}
              className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 overflow-hidden"
            >
              <div className="flex items-center gap-3 p-5 bg-[#FAFBFC] dark:bg-slate-800/50 border-b border-[#E5E7EB] dark:border-slate-700">
                <div className={`w-9 h-9 rounded-lg ${method.color} flex items-center justify-center`}>
                  <method.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100">
                    {method.name}
                  </h3>
                  <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                    Security Level: {method.security}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <p className="text-[14px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
                  {method.description}
                </p>
                <div className="space-y-2">
                  {method.flow.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#E0F5EA] dark:bg-emerald-900/30 text-[#059669] dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[13px] text-[#6B7280] dark:text-slate-400">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security Model */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Security Model
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Every Roil user receives an Ed25519 keypair that represents their Canton Network party.
          The private key is encrypted at rest and only decrypted in-memory during transaction signing.
        </p>

        <div className="bg-[#1E293B] rounded-lg p-4 mb-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`// Key generation and encryption flow
const keypair = Ed25519.generateKeypair();      // 32-byte seed
const aesKey  = AES256GCM.deriveKey(password);   // PBKDF2 → 256-bit key
const encrypted = AES256GCM.encrypt(             // AES-256-GCM
  keypair.privateKey,
  aesKey,
  crypto.getRandomValues(new Uint8Array(12))     // 96-bit nonce
);

// Stored in browser (IndexedDB)
const keystore = {
  publicKey: keypair.publicKey,    // Hex-encoded, also registered on server
  encryptedPrivateKey: encrypted,  // AES-256-GCM ciphertext + tag
  nonce: nonce,                    // 12-byte IV
  kdfParams: {
    algorithm: 'PBKDF2',
    iterations: 100_000,
    hash: 'SHA-256',
  },
};`}
          </pre>
        </div>

        <div className="bg-[#FFFBEB] dark:bg-amber-900/20 border border-[#FDE68A] dark:border-amber-800 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#D97706] dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[14px] font-semibold text-[#92400E] dark:text-amber-300 mb-1">
                Security Note
              </h4>
              <p className="text-[13px] text-[#92400E] dark:text-amber-300/80 leading-relaxed">
                Your private key never leaves the browser in plaintext. All signing operations happen
                client-side. The server only receives signed transactions, never raw keys. For Passkey
                users, the key material is managed by the device&rsquo;s secure enclave.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Backup & Recovery */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Backup & Recovery
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Roil provides two recovery mechanisms to ensure you never lose access to your portfolio:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 mb-2">
              Encrypted Keystore Export
            </h3>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              Download your encrypted keystore as a JSON file. This file contains your AES-256-GCM
              encrypted private key and the KDF parameters needed to derive the decryption key from
              your password. Store it securely offline.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 mb-2">
              Server-Side Recovery
            </h3>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              If you authenticated via Google or Email OTP, you can re-authenticate through the same
              provider. The server maps your verified identity to your Canton party and provisions a new
              session without requiring keystore import.
            </p>
          </div>
        </div>
      </section>

      {/* Keystore Format */}
      <section>
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Keystore Format
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          The exported keystore follows a standard JSON structure compatible with common cryptographic libraries:
        </p>
        <div className="bg-[#1E293B] rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`{
  "version": 1,
  "type": "roil-keystore",
  "publicKey": "302a300506032b65700321...",
  "address": "user::a1b2c3d4e5f6...",
  "crypto": {
    "cipher": "aes-256-gcm",
    "ciphertext": "7f8e9d...",
    "cipherparams": {
      "iv": "a1b2c3d4e5f67890abcd"
    },
    "kdf": "pbkdf2",
    "kdfparams": {
      "dklen": 32,
      "salt": "e5f6a7b8...",
      "c": 100000,
      "prf": "hmac-sha256"
    },
    "mac": "d4e5f6a7b8c9..."
  }
}`}
          </pre>
        </div>
      </section>
    </div>
  );
}
