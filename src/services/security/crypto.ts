import * as Crypto from 'expo-crypto';

const AES_GCM_IV_LENGTH = 12;

function getSubtleCrypto(): SubtleCrypto {
  const globalCrypto = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (!globalCrypto?.subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is not available in this environment.');
  }
  return globalCrypto.subtle;
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function stringToBytes(str: string): Uint8Array {
  const Encoder = (globalThis as unknown as { TextEncoder?: typeof TextEncoder }).TextEncoder;
  if (Encoder) {
    return new Encoder().encode(str);
  }
  // Manual UTF-8 fallback for environments without TextEncoder
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
      code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
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

function bytesToString(bytes: Uint8Array): string {
  const Decoder = (globalThis as unknown as { TextDecoder?: typeof TextDecoder }).TextDecoder;
  if (Decoder) {
    return new Decoder().decode(bytes);
  }
  // Manual UTF-8 fallback for environments without TextDecoder
  let str = '';
  let i = 0;
  while (i < bytes.length) {
    const byte1 = bytes[i++]!;
    if (byte1 < 0x80) {
      str += String.fromCharCode(byte1);
    } else if ((byte1 & 0xe0) === 0xc0) {
      const byte2 = bytes[i++]! & 0x3f;
      str += String.fromCharCode(((byte1 & 0x1f) << 6) | byte2);
    } else if ((byte1 & 0xf0) === 0xe0) {
      const byte2 = bytes[i++]! & 0x3f;
      const byte3 = bytes[i++]! & 0x3f;
      str += String.fromCharCode(((byte1 & 0x0f) << 12) | (byte2 << 6) | byte3);
    } else if ((byte1 & 0xf8) === 0xf0) {
      const byte2 = bytes[i++]! & 0x3f;
      const byte3 = bytes[i++]! & 0x3f;
      const byte4 = bytes[i++]! & 0x3f;
      let codepoint = ((byte1 & 0x07) << 18) | (byte2 << 12) | (byte3 << 6) | byte4;
      codepoint -= 0x10000;
      str += String.fromCharCode(0xd800 + (codepoint >> 10), 0xdc00 + (codepoint & 0x3ff));
    }
  }
  return str;
}

/**
 * Encrypt a plaintext string using AES-GCM with a 256-bit key.
 *
 * The returned string is base64-encoded and contains the 12-byte IV followed
 * by the ciphertext and authentication tag.
 *
 * @param plaintext - The raw string to encrypt.
 * @param key - A 64-character hex-encoded 256-bit AES key.
 * @returns Base64-encoded ciphertext with embedded IV.
 */
export async function encrypt(plaintext: string, key: string): Promise<string> {
  try {
    const subtle = getSubtleCrypto();
    const iv = Crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH));
    const keyBuffer = hexToBuffer(key);

    const cryptoKey = await subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const encoded = stringToBytes(plaintext);
    const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoded);

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return bufferToBase64(combined.buffer);
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Decrypt a ciphertext string that was produced by {@link encrypt}.
 *
 * @param ciphertext - Base64-encoded ciphertext with embedded IV.
 * @param key - A 64-character hex-encoded 256-bit AES key.
 * @returns The decrypted plaintext string.
 */
export async function decrypt(ciphertext: string, key: string): Promise<string> {
  try {
    const subtle = getSubtleCrypto();
    const combined = new Uint8Array(base64ToBuffer(ciphertext));

    if (combined.length < AES_GCM_IV_LENGTH) {
      throw new Error('Invalid ciphertext: too short to contain IV.');
    }

    const iv = combined.slice(0, AES_GCM_IV_LENGTH);
    const encrypted = combined.slice(AES_GCM_IV_LENGTH);
    const keyBuffer = hexToBuffer(key);

    const cryptoKey = await subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, encrypted);
    return bytesToString(new Uint8Array(decrypted));
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
