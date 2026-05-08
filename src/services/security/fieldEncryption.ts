import { gcm } from '@noble/ciphers/aes.js';
import * as CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import { getOrCreateEncryptionKey } from './keyStore';
import {
  uint8ToWordArray,
  wordArrayToUint8,
  base64ToUint8,
  uint8ToBase64,
  timingSafeEqual,
} from './cryptoUtils';

const V2_PREFIX = 'v2:';
const GCM_IV_LENGTH = 12; // bytes — recommended for AES-GCM (NIST SP 800-38D §5.2.1.1)

const LEGACY_IV_LENGTH = 16; // bytes — legacy CBC IV
const LEGACY_HASH_LENGTH = 32; // bytes — legacy SHA-256(plaintext) integrity tag

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i++) {
    if (i % 2 === 0) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
  }
  return bytes;
}

function hexToWordArray(hex: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Hex.parse(hex);
}

function utf8Encode(str: string): Uint8Array {
  // React Native and modern Hermes both expose TextEncoder.
  // Fallback path computes UTF-8 manually for older runtimes.
  const Encoder = (globalThis as { TextEncoder?: typeof TextEncoder }).TextEncoder;
  if (Encoder) {
    return new Encoder().encode(str);
  }
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
  if (Decoder) {
    return new Decoder('utf-8', { fatal: true }).decode(bytes);
  }
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
 * Encrypt a plaintext string using AES-256-GCM with the device-stored key.
 *
 * The returned string is `v2:` + base64 of `[12-byte IV][ciphertext][16-byte GCM tag]`.
 * The `v2:` prefix lets {@link decryptField} distinguish new GCM ciphertexts from
 * legacy AES-256-CBC + SHA-256 ciphertexts produced by earlier versions.
 *
 * Null and undefined values are passed through unchanged. Empty strings are
 * encrypted normally.
 */
export async function encryptField(plaintext: string | null | undefined): Promise<string | null> {
  if (plaintext === null || plaintext === undefined) {
    return null;
  }

  try {
    const hexKey = await getOrCreateEncryptionKey();
    const key = hexToBytes(hexKey);
    const iv = Crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH));

    const cipher = gcm(key, iv);
    const sealed = cipher.encrypt(utf8Encode(plaintext));

    const combined = new Uint8Array(GCM_IV_LENGTH + sealed.length);
    combined.set(iv, 0);
    combined.set(sealed, GCM_IV_LENGTH);

    return V2_PREFIX + uint8ToBase64(combined);
  } catch (error) {
    throw new Error(
      `Field encryption failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Decrypt a ciphertext string produced by {@link encryptField}.
 *
 * Auto-detects the format:
 * - `v2:` prefix → AES-256-GCM (current format)
 * - no prefix    → AES-256-CBC + SHA-256(plaintext) (legacy, kept for read-side
 *   back-compat until the v5 schema migration re-encrypts every row)
 *
 * Null and undefined values are passed through unchanged.
 */
export async function decryptField(ciphertext: string | null | undefined): Promise<string | null> {
  if (ciphertext === null || ciphertext === undefined) {
    return null;
  }

  try {
    if (ciphertext.startsWith(V2_PREFIX)) {
      return await decryptV2Gcm(ciphertext.slice(V2_PREFIX.length));
    }
    return await decryptLegacyCbcSha(ciphertext);
  } catch (error) {
    throw new Error(
      `Field decryption failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function decryptV2Gcm(base64Body: string): Promise<string> {
  const hexKey = await getOrCreateEncryptionKey();
  const key = hexToBytes(hexKey);
  const combined = base64ToUint8(base64Body);

  if (combined.length < GCM_IV_LENGTH + 16) {
    throw new Error('Invalid v2 ciphertext: too short to contain IV and authentication tag.');
  }

  const iv = combined.slice(0, GCM_IV_LENGTH);
  const sealed = combined.slice(GCM_IV_LENGTH);

  const cipher = gcm(key, iv);
  const plaintextBytes = cipher.decrypt(sealed);
  return utf8Decode(plaintextBytes);
}

/**
 * Legacy decrypt path for ciphertexts produced before the v2 GCM migration.
 * Format: base64 of `[16-byte IV][ciphertext][32-byte SHA-256(plaintext)]`.
 * Kept readable so the v5 schema migration can decrypt-then-re-encrypt every
 * encrypted row and so long-lived backup files remain restorable.
 */
async function decryptLegacyCbcSha(ciphertext: string): Promise<string> {
  const hexKey = await getOrCreateEncryptionKey();
  const key = hexToWordArray(hexKey);

  const combined = base64ToUint8(ciphertext);
  const minLength = LEGACY_IV_LENGTH + LEGACY_HASH_LENGTH;
  if (combined.length < minLength) {
    throw new Error('Invalid ciphertext: too short to contain IV and integrity hash.');
  }

  const iv = uint8ToWordArray(combined.slice(0, LEGACY_IV_LENGTH));
  const encrypted = uint8ToWordArray(
    combined.slice(LEGACY_IV_LENGTH, combined.length - LEGACY_HASH_LENGTH)
  );
  const expectedHash = combined.slice(combined.length - LEGACY_HASH_LENGTH);

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
    throw new Error('Integrity check failed: data may have been tampered with.');
  }

  return plaintext;
}
