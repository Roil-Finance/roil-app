import { Shield, Key, Fingerprint, Lock, Users } from 'lucide-react';

export default function WalletSecurity() {
  return (
    <div>
      <h1 className="text-[32px] lg:text-[36px] font-bold text-[#111827] dark:text-slate-100 mb-3">
        Wallet Security
      </h1>
      <p className="text-[16px] text-[#6B7280] dark:text-slate-400 leading-relaxed mb-10 max-w-[640px]">
        A deep dive into the cryptographic primitives, authentication protocols, and authorization
        model that protect your assets on Roil.
      </p>

      {/* Ed25519 */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#E0F5EA] dark:bg-emerald-900/30 flex items-center justify-center">
            <Key className="w-4 h-4 text-[#059669] dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100">
            Ed25519 Keypair Generation
          </h2>
        </div>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Each Roil user receives an Ed25519 keypair that serves as their Canton Network identity.
          Ed25519 was chosen for its fast verification, small key sizes (32 bytes), deterministic
          signatures, and resistance to side-channel attacks.
        </p>
        <div className="bg-[#1E293B] rounded-lg p-4 mb-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`// Key generation
const seed = crypto.getRandomValues(new Uint8Array(32));  // 256-bit seed
const keypair = Ed25519.fromSeed(seed);

keypair.publicKey   // 32 bytes — registered with Canton participant
keypair.privateKey  // 64 bytes (seed + public) — encrypted at rest

// Transaction signing
const signature = Ed25519.sign(transactionHash, keypair.privateKey);
// Verified on Canton participant before ledger commit`}
          </pre>
        </div>
        <p className="text-[14px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
          The public key is registered with the Canton participant node during party provisioning.
          Every ledger command submitted by the user must include a valid Ed25519 signature over the
          command hash. The participant verifies this signature before forwarding to the domain.
        </p>
      </section>

      {/* AES-256-GCM */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] dark:bg-blue-900/30 flex items-center justify-center">
            <Lock className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100">
            AES-256-GCM Encryption
          </h2>
        </div>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          The private key is never stored in plaintext. It is encrypted using AES-256-GCM
          (Galois/Counter Mode), which provides both confidentiality and integrity verification.
        </p>
        <div className="bg-[#1E293B] rounded-lg p-4 mb-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`// Encryption parameters
Algorithm:  AES-256-GCM
Key size:   256 bits (derived via PBKDF2)
Nonce:      96 bits (12 bytes, random per encryption)
Tag size:   128 bits (authentication tag)

// Key derivation
const salt = crypto.getRandomValues(new Uint8Array(32));
const aesKey = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: salt,
    iterations: 100_000,
    hash: 'SHA-256',
  },
  passwordKey,        // CryptoKey from user's password
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);

// Encrypt private key
const nonce = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv: nonce },
  aesKey,
  privateKeyBytes
);`}
          </pre>
        </div>

        <div className="bg-[#F0FDF4] dark:bg-emerald-900/20 border border-[#BBF7D0] dark:border-emerald-800 rounded-xl p-5">
          <p className="text-[14px] text-[#059669] dark:text-emerald-400 leading-relaxed">
            <strong>PBKDF2 parameters:</strong> 100,000 iterations with SHA-256 and a random 256-bit salt.
            This ensures that even weak passwords require significant computational effort to brute-force
            from the stored keystore.
          </p>
        </div>
      </section>

      {/* WebAuthn */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#EDE9FE] dark:bg-violet-900/30 flex items-center justify-center">
            <Fingerprint className="w-4 h-4 text-[#7C3AED] dark:text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100">
            WebAuthn / Passkey
          </h2>
        </div>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Passkey authentication uses the Web Authentication API (WebAuthn) to create a hardware-bound
          credential on the user&rsquo;s device. The private key material never leaves the secure enclave
          (TPM, Secure Enclave, or external hardware key).
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <h4 className="text-[14px] font-semibold text-[#111827] dark:text-slate-100 mb-1">Registration</h4>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              The server generates a challenge. The browser calls <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">navigator.credentials.create()</code> which
              prompts the user for biometric verification. The authenticator generates a new keypair, signs
              the challenge, and returns the public key + attestation to the server.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <h4 className="text-[14px] font-semibold text-[#111827] dark:text-slate-100 mb-1">Authentication</h4>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              The server sends a challenge. The browser calls <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">navigator.credentials.get()</code> which
              prompts for biometric. The authenticator signs the challenge with the stored private key.
              Server verifies the signature against the registered public key.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <h4 className="text-[14px] font-semibold text-[#111827] dark:text-slate-100 mb-1">Supported Authenticators</h4>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              Platform authenticators (Touch ID, Face ID, Windows Hello), roaming authenticators (YubiKey,
              Titan Security Key), and cross-device authenticators via QR code (iPhone authenticating a
              desktop session).
            </p>
          </div>
        </div>
      </section>

      {/* JWT */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#FEF3C7] dark:bg-amber-900/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#D97706] dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100">
            JWT Authentication
          </h2>
        </div>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          After successful authentication, the server issues a JSON Web Token (JWT) that encodes
          the user&rsquo;s Canton party identifier and permissions. All API requests must include this
          token in the <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">Authorization: Bearer</code> header.
        </p>
        <div className="bg-[#1E293B] rounded-lg p-4 mb-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`// JWT payload structure
{
  "sub": "alice::a1b2c3d4e5f6...",   // Canton party ID
  "actAs": ["alice::a1b2c3d4e5f6..."],// Parties the user can act as
  "readAs": ["alice::a1b2c3d4e5f6..."],// Parties the user can read as
  "iat": 1711382400,                   // Issued at timestamp
  "exp": 1711468800                    // Expires in 24 hours
}

// API request with JWT
fetch('/api/portfolio/alice::a1b2c3...', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...',
    'Content-Type': 'application/json',
  }
});`}
          </pre>
        </div>

        <div className="bg-[#FFFBEB] dark:bg-amber-900/20 border border-[#FDE68A] dark:border-amber-800 rounded-xl p-5">
          <p className="text-[13px] text-[#92400E] dark:text-amber-300/80 leading-relaxed">
            <strong>Authorization enforcement:</strong> The backend middleware (<code className="font-mono">requireParty</code>)
            verifies that the JWT&rsquo;s <code className="font-mono">actAs</code> list includes the party
            specified in the request URL. Requests for parties not in the token&rsquo;s scope receive a 403 Forbidden response.
          </p>
        </div>
      </section>

      {/* Canton Party Model */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#FEE2E2] dark:bg-red-900/30 flex items-center justify-center">
            <Users className="w-4 h-4 text-[#EF4444] dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100">
            Canton Party Model
          </h2>
        </div>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          In Canton Network, a <em>party</em> is the fundamental unit of identity and authorization.
          Each party has a unique identifier in the format
          <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">identifier::hexFingerprint</code> (e.g.
          <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">alice::a1b2c3d4e5f6</code>).
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <h4 className="text-[14px] font-semibold text-[#111827] dark:text-slate-100 mb-1">Signatories & Observers</h4>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              Every Daml contract specifies signatories (parties that must authorize creation) and
              observers (parties that can see the contract). Roil contracts use the platform party and
              user party as co-signatories, ensuring both must agree on state changes.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <h4 className="text-[14px] font-semibold text-[#111827] dark:text-slate-100 mb-1">Choices & Controllers</h4>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              Contract choices (actions) have designated controllers. For example, <code className="font-mono text-[12px]">UpdateTargets</code> on
              a Portfolio contract can only be exercised by the <code className="font-mono text-[12px]">user</code> party. The platform
              party exercises choices like <code className="font-mono text-[12px]">ExecuteRebalance</code> after verifying the user&rsquo;s intent.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <h4 className="text-[14px] font-semibold text-[#111827] dark:text-slate-100 mb-1">Sub-Transaction Privacy</h4>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              Canton&rsquo;s key innovation: within a single transaction, each sub-action is only visible
              to its stakeholders. When Roil rebalances your portfolio, the DEX sees the swap details
              but not your full portfolio composition. Other users see nothing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
