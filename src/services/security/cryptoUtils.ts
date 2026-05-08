import * as CryptoJS from 'crypto-js';

/**
 * Convert a Uint8Array to a CryptoJS WordArray.
 */
export function uint8ToWordArray(u8: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  for (let i = 0; i < u8.length; i++) {
    words[i >>> 2] = (words[i >>> 2] ?? 0) | (u8[i]! << (24 - (i % 4) * 8));
  }
  return CryptoJS.lib.WordArray.create(words, u8.length);
}

/**
 * Convert a CryptoJS WordArray to a Uint8Array.
 */
export function wordArrayToUint8(wa: CryptoJS.lib.WordArray): Uint8Array {
  const u8 = new Uint8Array(wa.sigBytes);
  for (let i = 0; i < wa.sigBytes; i++) {
    u8[i] = (wa.words[i >>> 2]! >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8;
}

/**
 * Parse a base64 string into a Uint8Array.
 */
export function base64ToUint8(base64: string): Uint8Array {
  const wa = CryptoJS.enc.Base64.parse(base64);
  return wordArrayToUint8(wa);
}

/**
 * Encode a Uint8Array as a base64 string.
 */
export function uint8ToBase64(u8: Uint8Array): string {
  const wa = uint8ToWordArray(u8);
  return CryptoJS.enc.Base64.stringify(wa);
}

/**
 * Timing-safe equality comparison for Uint8Arrays.
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i]! ^ b[i]!;
  }
  return result === 0;
}
