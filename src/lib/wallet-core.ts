/**
 * Roil Wallet Core — Ed25519 keypair wallet for Canton Network
 *
 * Canton Network does not have browser extension wallets (like MetaMask).
 * Each application creates its own wallet. This module provides:
 *
 *  - Ed25519 keypair generation (via @noble/curves)
 *  - AES-256-GCM encryption of private keys (via Web Crypto API)
 *  - Canton-format party ID derivation
 *  - JWT creation for Canton JSON API auth (actAs/readAs claims)
 *  - Keystore import/export (encrypted JSON)
 *  - localStorage persistence (only encrypted data is ever stored)
 */

import { ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoilWallet {
  partyId: string;
  publicKey: string; // hex
  displayName: string;
  createdAt: number;
}

export type SignFunction = (msg: string) => Promise<string>;

interface EncryptedKeystore {
  version: 1;
  publicKey: string;
  displayName: string;
  partyId: string;
  createdAt: number;
  crypto: {
    cipher: 'aes-256-gcm';
    iv: string;  // hex
    salt: string; // hex
    ciphertext: string; // hex
    tag: string; // hex — included in ciphertext for Web Crypto
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'roil_wallet_keystore';
const PBKDF2_ITERATIONS = 310_000; // OWASP 2023 recommendation for SHA-256
const SALT_BYTES = 32;
const IV_BYTES = 12; // AES-GCM standard

// ---------------------------------------------------------------------------
// Crypto helpers (Web Crypto API)
// ---------------------------------------------------------------------------

/** Derive a 256-bit AES key from a password + salt via PBKDF2. */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypt a plaintext string with AES-256-GCM. */
async function encryptPrivateKey(
  privateKeyHex: string,
  password: string,
): Promise<{ iv: string; salt: string; ciphertext: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);

  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(privateKeyHex),
  );

  return {
    iv: bytesToHex(iv),
    salt: bytesToHex(salt),
    ciphertext: bytesToHex(new Uint8Array(encrypted)),
  };
}

/** Decrypt ciphertext back to the private key hex string. */
async function decryptPrivateKey(
  ciphertextHex: string,
  ivHex: string,
  saltHex: string,
  password: string,
): Promise<string> {
  const salt = hexToBytes(saltHex);
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);
  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );

  return new TextDecoder().decode(decrypted);
}

// ---------------------------------------------------------------------------
// Canton helpers
// ---------------------------------------------------------------------------

/**
 * Derive a Canton-format party ID from a public key.
 *
 * Canton party IDs follow the format: `<name>::<fingerprint>`
 * where fingerprint is a hex-encoded hash of the public key prefixed with
 * the TIP-0003 multicodec prefix `1220` (sha2-256).
 */
function derivePartyId(publicKeyHex: string, displayName: string): string {
  const pubBytes = hexToBytes(publicKeyHex);
  const hash = sha256(pubBytes);
  // TIP-0003: prefix with 1220 (sha2-256 multicodec)
  const fingerprint = '1220' + bytesToHex(hash);
  return `${displayName}::${fingerprint}`;
}

/**
 * Build a base64url-encoded JWT signed with Ed25519.
 *
 * Canton JSON API expects a JWT with:
 *  - sub: party ID
 *  - actAs: [party ID]
 *  - readAs: [party ID]
 *  - scope: "daml_ledger_api"
 */
function base64url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  // Use btoa for browser compatibility
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ---------------------------------------------------------------------------
// WalletManager
// ---------------------------------------------------------------------------

export class WalletManager {
  /**
   * Create a new wallet with a fresh Ed25519 keypair.
   * The private key is encrypted with the password and stored in localStorage.
   */
  static async createWallet(name: string, password: string): Promise<RoilWallet> {
    // Generate Ed25519 keypair
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(privateKey);

    const privateKeyHex = bytesToHex(privateKey);
    const publicKeyHex = bytesToHex(publicKey);
    const partyId = derivePartyId(publicKeyHex, name);

    // Encrypt the private key
    const encrypted = await encryptPrivateKey(privateKeyHex, password);

    const keystore: EncryptedKeystore = {
      version: 1,
      publicKey: publicKeyHex,
      displayName: name,
      partyId,
      createdAt: Date.now(),
      crypto: {
        cipher: 'aes-256-gcm',
        iv: encrypted.iv,
        salt: encrypted.salt,
        ciphertext: encrypted.ciphertext,
        tag: '', // Web Crypto includes tag in ciphertext
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(keystore));

    return {
      partyId,
      publicKey: publicKeyHex,
      displayName: name,
      createdAt: keystore.createdAt,
    };
  }

  /**
   * Unlock the wallet by decrypting the stored private key.
   * Returns the wallet info and a sign function for creating JWTs.
   */
  static async unlockWallet(password: string): Promise<{
    wallet: RoilWallet;
    sign: SignFunction;
  }> {
    const keystore = WalletManager.loadKeystore();
    if (!keystore) {
      throw new Error('No wallet found. Please create a wallet first.');
    }

    let privateKeyHex: string;
    try {
      privateKeyHex = await decryptPrivateKey(
        keystore.crypto.ciphertext,
        keystore.crypto.iv,
        keystore.crypto.salt,
        password,
      );
    } catch {
      throw new Error('Incorrect password. Please try again.');
    }

    // Verify the decrypted key matches the stored public key
    const derivedPub = bytesToHex(ed25519.getPublicKey(hexToBytes(privateKeyHex)));
    if (derivedPub !== keystore.publicKey) {
      throw new Error('Key verification failed. Keystore may be corrupted.');
    }

    const sign: SignFunction = async (msg: string) => {
      const msgBytes = new TextEncoder().encode(msg);
      const signature = ed25519.sign(msgBytes, hexToBytes(privateKeyHex));
      return bytesToHex(signature);
    };

    return {
      wallet: {
        partyId: keystore.partyId,
        publicKey: keystore.publicKey,
        displayName: keystore.displayName,
        createdAt: keystore.createdAt,
      },
      sign,
    };
  }

  /**
   * Import a wallet from a raw private key hex string.
   */
  static async importFromKey(
    privateKeyHex: string,
    name: string,
    password: string,
  ): Promise<RoilWallet> {
    // Validate the key
    let pubKey: Uint8Array;
    try {
      const keyBytes = hexToBytes(privateKeyHex);
      if (keyBytes.length !== 32) {
        throw new Error('Invalid key length');
      }
      pubKey = ed25519.getPublicKey(keyBytes);
    } catch {
      throw new Error('Invalid private key. Expected 64-character hex string (32 bytes).');
    }

    const publicKeyHex = bytesToHex(pubKey);
    const partyId = derivePartyId(publicKeyHex, name);

    // Encrypt and store
    const encrypted = await encryptPrivateKey(privateKeyHex, password);

    const keystore: EncryptedKeystore = {
      version: 1,
      publicKey: publicKeyHex,
      displayName: name,
      partyId,
      createdAt: Date.now(),
      crypto: {
        cipher: 'aes-256-gcm',
        iv: encrypted.iv,
        salt: encrypted.salt,
        ciphertext: encrypted.ciphertext,
        tag: '',
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(keystore));

    return {
      partyId,
      publicKey: publicKeyHex,
      displayName: name,
      createdAt: keystore.createdAt,
    };
  }

  /**
   * Import a wallet from a previously exported keystore JSON.
   * The keystore is re-encrypted with the new password.
   */
  static async importFromKeystore(
    keystoreJson: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<RoilWallet> {
    let keystore: EncryptedKeystore;
    try {
      keystore = JSON.parse(keystoreJson);
    } catch {
      throw new Error('Invalid keystore format. Expected valid JSON.');
    }

    if (keystore.version !== 1 || !keystore.crypto?.ciphertext) {
      throw new Error('Unsupported keystore version or format.');
    }

    // Decrypt with old password
    let privateKeyHex: string;
    try {
      privateKeyHex = await decryptPrivateKey(
        keystore.crypto.ciphertext,
        keystore.crypto.iv,
        keystore.crypto.salt,
        oldPassword,
      );
    } catch {
      throw new Error('Incorrect keystore password.');
    }

    // Re-encrypt with new password and store
    return WalletManager.importFromKey(privateKeyHex, keystore.displayName, newPassword);
  }

  /**
   * Export the current wallet as an encrypted keystore JSON string.
   * The keystore remains encrypted with the current password.
   */
  static exportKeystore(password: string): Promise<string> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return Promise.reject(new Error('No wallet found to export.'));
    }

    // We return the stored keystore as-is (it's already encrypted).
    // The password parameter is for future use if we want to re-encrypt
    // with a different key for export, but for now we validate it by
    // attempting a decrypt.
    return (async () => {
      const keystore: EncryptedKeystore = JSON.parse(raw);

      // Verify password is correct before exporting
      try {
        await decryptPrivateKey(
          keystore.crypto.ciphertext,
          keystore.crypto.iv,
          keystore.crypto.salt,
          password,
        );
      } catch {
        throw new Error('Incorrect password. Cannot export keystore.');
      }

      return JSON.stringify(keystore, null, 2);
    })();
  }

  /**
   * Check whether a wallet exists in localStorage.
   */
  static hasWallet(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  /**
   * Get public wallet info (no private key). Returns null if no wallet.
   */
  static getWalletInfo(): RoilWallet | null {
    const keystore = WalletManager.loadKeystore();
    if (!keystore) return null;

    return {
      partyId: keystore.partyId,
      publicKey: keystore.publicKey,
      displayName: keystore.displayName,
      createdAt: keystore.createdAt,
    };
  }

  /**
   * Delete the wallet from localStorage. This is irreversible.
   */
  static deleteWallet(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Create a signed JWT for Canton JSON API authentication.
   *
   * The JWT header specifies EdDSA algorithm, and the payload includes
   * the standard Canton claims (sub, actAs, readAs, scope).
   */
  static async createJWT(sign: SignFunction, partyId: string): Promise<string> {
    const header = {
      alg: 'EdDSA',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: partyId,
      iss: 'roil-finance',
      aud: 'canton-json-api',
      iat: now,
      exp: now + 3600, // 1 hour expiry
      scope: 'daml_ledger_api',
      actAs: [partyId],
      readAs: [partyId],
      applicationId: 'roil-finance-ui',
    };

    const headerB64 = base64url(JSON.stringify(header));
    const payloadB64 = base64url(JSON.stringify(payload));
    const signingInput = `${headerB64}.${payloadB64}`;

    // Sign the JWT with Ed25519
    const signatureHex = await sign(signingInput);
    const signatureB64 = base64url(hexToBytes(signatureHex));

    return `${signingInput}.${signatureB64}`;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private static loadKeystore(): EncryptedKeystore | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const keystore = JSON.parse(raw) as EncryptedKeystore;
      if (keystore.version !== 1 || !keystore.crypto?.ciphertext) return null;
      return keystore;
    } catch {
      return null;
    }
  }
}
