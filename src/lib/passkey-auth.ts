/**
 * WebAuthn Passkey Authentication for Roil Finance
 *
 * Provides passkey (biometric) registration and authentication,
 * plus key derivation for encrypting/decrypting Ed25519 wallet keys.
 *
 * Flow:
 *   1. Register: biometric prompt -> credential created -> stored in localStorage
 *   2. Authenticate: biometric prompt -> assertion signed -> returns auth data
 *   3. Key derivation: auth data -> HKDF -> AES-256-GCM key -> encrypt/decrypt wallet
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PasskeyCredential {
  credentialId: string;     // base64url encoded
  publicKey: string;        // base64url encoded
  userHandle: string;       // base64url encoded user ID
  displayName: string;
}

export interface PasskeyAuthResult {
  credentialId: string;
  signature: Uint8Array;
  authenticatorData: Uint8Array;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PASSKEY_STORAGE_KEY = 'roil_passkey_credential';
const HKDF_INFO = 'roil-wallet-passkey-encryption';

// ---------------------------------------------------------------------------
// Base64url helpers
// ---------------------------------------------------------------------------

function toBase64url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64url(str: string): Uint8Array {
  // Restore standard base64 padding
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Feature detection
// ---------------------------------------------------------------------------

/**
 * Check if WebAuthn is supported in this browser.
 * Requires secure context (HTTPS or localhost) and PublicKeyCredential API.
 */
export function isPasskeySupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  );
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register a new passkey (create credential).
 *
 * Opens the browser's biometric/PIN prompt to create a platform authenticator
 * credential. The credential ID and public key are stored in localStorage.
 */
export async function registerPasskey(
  displayName: string,
  email?: string,
): Promise<PasskeyCredential> {
  if (!isPasskeySupported()) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  // Generate random user handle (32 bytes)
  const userId = crypto.getRandomValues(new Uint8Array(32));

  const userName = email || displayName;

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rp: {
      name: 'Roil App',
      id: window.location.hostname,
    },
    user: {
      id: userId,
      name: userName,
      displayName,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },   // ES256 (ECDSA w/ SHA-256)
      { alg: -257, type: 'public-key' },  // RS256 (RSASSA-PKCS1-v1_5 w/ SHA-256)
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      requireResidentKey: true,
      residentKey: 'required',
      userVerification: 'required',
    },
    attestation: 'none',
    timeout: 60_000,
  };

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  }) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Passkey registration was cancelled.');
  }

  const response = credential.response as AuthenticatorAttestationResponse;

  const passkeyCredential: PasskeyCredential = {
    credentialId: toBase64url(credential.rawId),
    publicKey: toBase64url(response.getPublicKey?.() ?? new Uint8Array()),
    userHandle: toBase64url(userId),
    displayName,
  };

  // Persist credential reference in localStorage
  localStorage.setItem(PASSKEY_STORAGE_KEY, JSON.stringify(passkeyCredential));

  return passkeyCredential;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Authenticate with an existing passkey.
 *
 * Opens the browser's biometric/PIN prompt to sign a challenge with the
 * previously registered credential. Returns the signature and authenticator
 * data for key derivation.
 */
export async function authenticateWithPasskey(): Promise<PasskeyAuthResult> {
  if (!isPasskeySupported()) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  const stored = localStorage.getItem(PASSKEY_STORAGE_KEY);
  if (!stored) {
    throw new Error('No passkey found. Please register a passkey first.');
  }

  const passkeyCredential: PasskeyCredential = JSON.parse(stored);
  const credentialId = fromBase64url(passkeyCredential.credentialId);

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rpId: window.location.hostname,
    allowCredentials: [
      {
        id: credentialId as BufferSource,
        type: 'public-key',
        transports: ['internal'],
      },
    ],
    userVerification: 'required',
    timeout: 60_000,
  };

  const assertion = await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions,
  }) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error('Passkey authentication was cancelled.');
  }

  const response = assertion.response as AuthenticatorAssertionResponse;

  return {
    credentialId: toBase64url(assertion.rawId),
    signature: new Uint8Array(response.signature),
    authenticatorData: new Uint8Array(response.authenticatorData),
  };
}

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

/**
 * Derive an AES-256-GCM encryption key from passkey authentication data.
 *
 * Uses HKDF with SHA-256 to derive a 256-bit key from the authenticator
 * response data. The authenticatorData + signature serve as high-entropy
 * input keying material.
 */
export async function deriveKeyFromPasskey(
  authResult: PasskeyAuthResult,
): Promise<CryptoKey> {
  // Combine authenticatorData and signature as input keying material
  const ikm = new Uint8Array(
    authResult.authenticatorData.length + authResult.signature.length,
  );
  ikm.set(authResult.authenticatorData, 0);
  ikm.set(authResult.signature, authResult.authenticatorData.length);

  // Import the combined data as raw key material for HKDF
  const baseKey = await crypto.subtle.importKey(
    'raw',
    ikm,
    'HKDF',
    false,
    ['deriveKey'],
  );

  const encoder = new TextEncoder();

  // Derive a 256-bit AES-GCM key via HKDF
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode('roil-passkey-salt'),
      info: encoder.encode(HKDF_INFO),
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ---------------------------------------------------------------------------
// Passkey encryption helpers
// ---------------------------------------------------------------------------

/**
 * Encrypt a private key hex string using a passkey-derived AES-GCM key.
 * Returns hex-encoded iv and ciphertext.
 */
export async function encryptWithPasskeyKey(
  privateKeyHex: string,
  encryptionKey: CryptoKey,
): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    encoder.encode(privateKeyHex),
  );

  // Convert to hex for storage
  return {
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    ciphertext: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
}

/**
 * Decrypt a private key hex string using a passkey-derived AES-GCM key.
 */
export async function decryptWithPasskeyKey(
  ciphertextHex: string,
  ivHex: string,
  decryptionKey: CryptoKey,
): Promise<string> {
  // Convert hex to bytes
  const iv = new Uint8Array(
    ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)),
  );
  const ciphertext = new Uint8Array(
    ciphertextHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)),
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    decryptionKey,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

// ---------------------------------------------------------------------------
// Stored credential helpers
// ---------------------------------------------------------------------------

/**
 * Check if a passkey credential is stored in localStorage.
 */
export function hasStoredPasskey(): boolean {
  return localStorage.getItem(PASSKEY_STORAGE_KEY) !== null;
}

/**
 * Get the stored passkey credential, or null if none.
 */
export function getStoredPasskey(): PasskeyCredential | null {
  const raw = localStorage.getItem(PASSKEY_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PasskeyCredential;
  } catch {
    return null;
  }
}

/**
 * Remove the stored passkey credential.
 */
export function removeStoredPasskey(): void {
  localStorage.removeItem(PASSKEY_STORAGE_KEY);
}
