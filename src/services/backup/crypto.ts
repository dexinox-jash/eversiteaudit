import { gcm } from '@noble/ciphers/aes.js';
import * as CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import {
  uint8ToWordArray,
  wordArrayToUint8,
  base64ToUint8,
  uint8ToBase64,
  timingSafeEqual,
} from '@services/security/cryptoUtils';

const V2_PREFIX = 'v2:';
const SALT_LENGTH = 16; // bytes
const GCM_IV_LENGTH = 12; // bytes
const LEGACY_IV_LENGTH = 16; // bytes
const LEGACY_HASH_LENGTH = 32; // bytes (SHA-256)
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_SIZE = 256 / 32; // words (CryptoJS format: 32 bits per word)

async function deriveKeyBytes(passphrase: string, salt: Uint8Array): Promise<Uint8Array> {
  await Promise.resolve();
  const saltWa = uint8ToWordArray(salt);
  const wa = CryptoJS.PBKDF2(passphrase, saltWa, {
    keySize: PBKDF2_KEY_SIZE,
    iterations: PBKDF2_ITERATIONS,
  });
  return wordArrayToUint8(wa);
}

async function deriveKeyWordArray(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoJS.lib.WordArray> {
  await Promise.resolve();
  const saltWa = uint8ToWordArray(salt);
  return CryptoJS.PBKDF2(passphrase, saltWa, {
    keySize: PBKDF2_KEY_SIZE,
    iterations: PBKDF2_ITERATIONS,
  });
}

function utf8Encode(str: string): Uint8Array {
  const Encoder = (globalThis as { TextEncoder?: typeof TextEncoder }).TextEncoder;
  if (Encoder) return new Encoder().encode(str);
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      i++;
      const next = str.charCodeAt(i);
      code = 0x10000 + (((code & 0x3ff) << 10) | (next & 0x3ff));
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

function utf8Decode(bytes: Uint8Array): string {
  const Decoder = (globalThis as { TextDecoder?: typeof TextDecoder }).TextDecoder;
  if (Decoder) return new Decoder('utf-8', { fatal: true }).decode(bytes);
  let str = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i]!;
    if (b < 0x80) {
      str += String.fromCharCode(b);
      i += 1;
    } else if (b < 0xe0) {
      const c = ((b & 0x1f) << 6) | (bytes[i + 1]! & 0x3f);
      str += String.fromCharCode(c);
      i += 2;
    } else if (b < 0xf0) {
      const c = ((b & 0x0f) << 12) | ((bytes[i + 1]! & 0x3f) << 6) | (bytes[i + 2]! & 0x3f);
      str += String.fromCharCode(c);
      i += 3;
    } else {
      let c =
        ((b & 0x07) << 18) |
        ((bytes[i + 1]! & 0x3f) << 12) |
        ((bytes[i + 2]! & 0x3f) << 6) |
        (bytes[i + 3]! & 0x3f);
      c -= 0x10000;
      str += String.fromCharCode(0xd800 + (c >> 10), 0xdc00 + (c & 0x3ff));
      i += 4;
    }
  }
  return str;
}

/**
 * Encrypt a plaintext string using PBKDF2-SHA256 → AES-256-GCM with a user-provided passphrase.
 *
 * The returned string is `v2:` + base64 of `[16-byte salt][12-byte IV][ciphertext + 16-byte tag]`.
 * The `v2:` prefix distinguishes new GCM ciphertexts from legacy AES-256-CBC + SHA-256
 * ciphertexts so old backups remain restorable.
 */
export async function encryptWithPassphrase(
  plaintext: string,
  passphrase: string
): Promise<string> {
  try {
    const salt = Crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = Crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH));
    const key = await deriveKeyBytes(passphrase, salt);

    const cipher = gcm(key, iv);
    const sealed = cipher.encrypt(utf8Encode(plaintext));

    const combined = new Uint8Array(SALT_LENGTH + GCM_IV_LENGTH + sealed.length);
    combined.set(salt, 0);
    combined.set(iv, SALT_LENGTH);
    combined.set(sealed, SALT_LENGTH + GCM_IV_LENGTH);

    return V2_PREFIX + uint8ToBase64(combined);
  } catch (error) {
    throw new Error(
      `Backup encryption failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Decrypt a ciphertext string produced by {@link encryptWithPassphrase}.
 *
 * Auto-detects the format:
 * - `v2:` prefix → PBKDF2 → AES-256-GCM (current format)
 * - no prefix    → PBKDF2 → AES-256-CBC + SHA-256(plaintext) (legacy, kept so
 *   backup files created before the v2 migration remain restorable).
 */
export async function decryptWithPassphrase(
  ciphertext: string,
  passphrase: string
): Promise<string> {
  try {
    if (ciphertext.startsWith(V2_PREFIX)) {
      return await decryptV2Gcm(ciphertext.slice(V2_PREFIX.length), passphrase);
    }
    return await decryptLegacyCbcSha(ciphertext, passphrase);
  } catch (error) {
    throw new Error(
      `Backup decryption failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function decryptV2Gcm(base64Body: string, passphrase: string): Promise<string> {
  const combined = base64ToUint8(base64Body);
  const minLength = SALT_LENGTH + GCM_IV_LENGTH + 16;
  if (combined.length < minLength) {
    throw new Error(
      'Invalid v2 ciphertext: too short to contain salt, IV, and authentication tag.'
    );
  }

  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + GCM_IV_LENGTH);
  const sealed = combined.slice(SALT_LENGTH + GCM_IV_LENGTH);

  const key = await deriveKeyBytes(passphrase, salt);
  const cipher = gcm(key, iv);
  const plaintextBytes = cipher.decrypt(sealed);
  return utf8Decode(plaintextBytes);
}

async function decryptLegacyCbcSha(ciphertext: string, passphrase: string): Promise<string> {
  const combined = base64ToUint8(ciphertext);
  const minLength = SALT_LENGTH + LEGACY_IV_LENGTH + LEGACY_HASH_LENGTH;
  if (combined.length < minLength) {
    throw new Error('Invalid ciphertext: too short to contain salt, IV, and integrity hash.');
  }

  const salt = combined.slice(0, SALT_LENGTH);
  const iv = uint8ToWordArray(combined.slice(SALT_LENGTH, SALT_LENGTH + LEGACY_IV_LENGTH));
  const encrypted = uint8ToWordArray(
    combined.slice(SALT_LENGTH + LEGACY_IV_LENGTH, combined.length - LEGACY_HASH_LENGTH)
  );
  const expectedHash = combined.slice(combined.length - LEGACY_HASH_LENGTH);

  const key = await deriveKeyWordArray(passphrase, salt);
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: encrypted } as CryptoJS.lib.CipherParams,
    key,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );

  const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
  if (!plaintext && decrypted.sigBytes > 0) {
    throw new Error('Decryption produced invalid UTF-8.');
  }

  const actualHash = wordArrayToUint8(CryptoJS.SHA256(plaintext));
  if (!timingSafeEqual(expectedHash, actualHash)) {
    throw new Error('Integrity check failed: incorrect passphrase or corrupted data.');
  }

  return plaintext;
}

/**
 * Encrypt an encryption key with a user-provided password using PBKDF2 → AES-256-GCM.
 */
export async function encryptKey(key: string, password: string): Promise<string> {
  return encryptWithPassphrase(key, password);
}

/**
 * Decrypt an encryption key that was encrypted with {@link encryptKey}.
 * Auto-dispatches between GCM (v2) and legacy CBC+SHA format.
 */
export async function decryptKey(encryptedKey: string, password: string): Promise<string> {
  return decryptWithPassphrase(encryptedKey, password);
}
