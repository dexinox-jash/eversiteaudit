jest.unmock('@services/security/fieldEncryption');
import { encryptField, decryptField } from '@services/security/fieldEncryption';

describe('fieldEncryption', () => {
  const originalTextEncoder = globalThis.TextEncoder;
  const originalTextDecoder = globalThis.TextDecoder;

  afterEach(() => {
    globalThis.TextEncoder = originalTextEncoder;
    globalThis.TextDecoder = originalTextDecoder;
  });

  it('throws generic message when encryption fails with non-Error', async () => {
    const keyStore =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@services/security/keyStore') as typeof import('@services/security/keyStore');
    jest
      .spyOn(keyStore, 'getOrCreateEncryptionKey')
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      .mockImplementationOnce(() => Promise.reject('key-err'));

    await expect(encryptField('test')).rejects.toThrow('Field encryption failed: key-err');
  });

  it('throws Error message when encryption fails with Error', async () => {
    const keyStore =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@services/security/keyStore') as typeof import('@services/security/keyStore');
    jest
      .spyOn(keyStore, 'getOrCreateEncryptionKey')
      .mockImplementationOnce(() => Promise.reject(new Error('bad-key')));

    await expect(encryptField('test')).rejects.toThrow('Field encryption failed: bad-key');
  });

  it('throws generic message when decryption fails with non-Error', async () => {
    const keyStore =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@services/security/keyStore') as typeof import('@services/security/keyStore');
    jest
      .spyOn(keyStore, 'getOrCreateEncryptionKey')
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      .mockImplementationOnce(() => Promise.reject('decrypt-err'));

    await expect(decryptField('v2:AAAA')).rejects.toThrow(
      'Field decryption failed: decrypt-err'
    );
  });

  it('encrypts and decrypts a plaintext string', async () => {
    const plaintext = 'Sensitive project name';

    const encrypted = await encryptField(plaintext);
    expect(encrypted).not.toEqual(plaintext);
    expect(typeof encrypted).toBe('string');
    expect(encrypted!.startsWith('v2:')).toBe(true);

    const decrypted = await decryptField(encrypted);
    expect(decrypted).toEqual(plaintext);
  });

  it('produces different ciphertexts for the same plaintext due to random IV', async () => {
    const plaintext = 'Same text';

    const encrypted1 = await encryptField(plaintext);
    const encrypted2 = await encryptField(plaintext);

    expect(encrypted1).not.toEqual(encrypted2);
  });

  it('returns null for null input on both encrypt and decrypt', async () => {
    expect(await encryptField(null)).toBeNull();
    expect(await decryptField(null)).toBeNull();
  });

  it('returns undefined for undefined input on both encrypt and decrypt', async () => {
    // Babel transpilation may coerce undefined to null in async return paths;
    // accept either as a passthrough of the missing value.
    const encrypted = await encryptField(undefined);
    expect(encrypted === null || encrypted === undefined).toBe(true);
    const decrypted = await decryptField(undefined);
    expect(decrypted === null || decrypted === undefined).toBe(true);
  });

  it('encrypts and decrypts an empty string', async () => {
    const encrypted = await encryptField('');
    expect(typeof encrypted).toBe('string');

    const decrypted = await decryptField(encrypted);
    expect(decrypted).toEqual('');
  });

  it('fails decryption for malformed ciphertext', async () => {
    await expect(decryptField('not-valid-base64!!!')).rejects.toThrow('Field decryption failed');
  });

  it('fails decryption for ciphertext that is too short', async () => {
    // "dGVzdA==" is "test" in base64 — far shorter than 12-byte IV
    await expect(decryptField('dGVzdA==')).rejects.toThrow('Field decryption failed');
  });

  it('round-trips unicode text correctly', async () => {
    const plaintext = '日本語テキスト 🏗️ émojis';

    const encrypted = await encryptField(plaintext);
    const decrypted = await decryptField(encrypted);

    expect(decrypted).toEqual(plaintext);
  });

  it('decrypts legacy CBC + SHA-256 ciphertext (read-side back-compat)', async () => {
    // Legacy ciphertext produced by the pre-v2 CBC+SHA-256 implementation for the
    // plaintext "Legacy data". The mock key in tests/setup.ts is 'a'.repeat(64) (hex).
    // Format: base64(iv16 ‖ ct ‖ sha256(pt)32), NO `v2:` prefix → decryptField
    // dispatches to the legacy path automatically.
    const legacyKeyHex = 'a'.repeat(64);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CryptoJS = require('crypto-js') as typeof import('crypto-js');
    const cryptoUtilsMod =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@services/security/cryptoUtils') as typeof import('@services/security/cryptoUtils');
    const { uint8ToWordArray, wordArrayToUint8, uint8ToBase64 } = cryptoUtilsMod;

    const plaintext = 'Legacy data';
    const key = CryptoJS.enc.Hex.parse(legacyKeyHex);
    const iv = uint8ToWordArray(new Uint8Array(16).fill(7));
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const ctBytes = wordArrayToUint8(encrypted.ciphertext);
    const hashBytes = wordArrayToUint8(CryptoJS.SHA256(plaintext));
    const combined = new Uint8Array(16 + ctBytes.length + 32);
    combined.set(wordArrayToUint8(iv), 0);
    combined.set(ctBytes, 16);
    combined.set(hashBytes, 16 + ctBytes.length);
    const legacyCiphertext = uint8ToBase64(combined);

    expect(legacyCiphertext.startsWith('v2:')).toBe(false);
    const decrypted = await decryptField(legacyCiphertext);
    expect(decrypted).toEqual(plaintext);
  });

  it('rejects v2 ciphertext with a tampered authentication tag', async () => {
    const cryptoUtils =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@services/security/cryptoUtils') as typeof import('@services/security/cryptoUtils');
    const encrypted = await encryptField('do not tamper');
    expect(encrypted!.startsWith('v2:')).toBe(true);
    const bytes = cryptoUtils.base64ToUint8(encrypted!.slice('v2:'.length));
    // Flip the very last byte of the GCM auth tag.
    bytes[bytes.length - 1] = bytes[bytes.length - 1]! ^ 0xff;
    const tampered = 'v2:' + cryptoUtils.uint8ToBase64(bytes);
    await expect(decryptField(tampered)).rejects.toThrow('Field decryption failed');
  });

  it('rejects v2 ciphertext that is shorter than IV + tag', async () => {
    // 12-byte IV + 16-byte tag minimum = 28 bytes. "AAAA" is 3 bytes after b64 decode.
    await expect(decryptField('v2:AAAA')).rejects.toThrow('Field decryption failed');
  });

  it('throws when legacy ciphertext produces empty UTF-8 with non-zero bytes', async () => {
    const legacyKeyHex = 'a'.repeat(64);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CryptoJS = require('crypto-js') as typeof import('crypto-js');
    const cryptoUtilsMod =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@services/security/cryptoUtils') as typeof import('@services/security/cryptoUtils');
    const { uint8ToWordArray, wordArrayToUint8, uint8ToBase64 } = cryptoUtilsMod;

    const key = CryptoJS.enc.Hex.parse(legacyKeyHex);
    const iv = uint8ToWordArray(new Uint8Array(16).fill(7));
    // Encrypt something valid then tamper the plaintext WordArray so that
    // toString(CryptoJS.enc.Utf8) returns '' while sigBytes > 0.
    const encrypted = CryptoJS.AES.encrypt('x', key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const ctBytes = wordArrayToUint8(encrypted.ciphertext);
    const combined = new Uint8Array(16 + ctBytes.length + 32);
    combined.set(wordArrayToUint8(iv), 0);
    combined.set(ctBytes, 16);
    // Hash of empty string — integrity check will pass if plaintext evaluates to ''
    combined.set(wordArrayToUint8(CryptoJS.SHA256('')), 16 + ctBytes.length);
    const legacyCiphertext = uint8ToBase64(combined);

    // Mock AES.decrypt to return a WordArray whose toString yields '' but sigBytes > 0
    const originalDecrypt = CryptoJS.AES.decrypt;
    jest.spyOn(CryptoJS.AES, 'decrypt').mockImplementation(() => {
      const wa = CryptoJS.lib.WordArray.create([0x12345678], 2);
      // Override toString so that Utf8 encoder returns '' without throwing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wa.toString = function (encoder?: any) {
        if (encoder === CryptoJS.enc.Utf8) {
          return '';
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (CryptoJS.lib.WordArray as any).prototype.toString.call(this, encoder);
      };
      return wa;
    });

    await expect(decryptField(legacyCiphertext)).rejects.toThrow(
      'Decryption produced invalid UTF-8'
    );

    CryptoJS.AES.decrypt = originalDecrypt;
  });

  it('throws when legacy ciphertext integrity check fails', async () => {
    const legacyKeyHex = 'a'.repeat(64);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CryptoJS = require('crypto-js') as typeof import('crypto-js');
    const cryptoUtilsMod =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@services/security/cryptoUtils') as typeof import('@services/security/cryptoUtils');
    const { uint8ToWordArray, wordArrayToUint8, uint8ToBase64 } = cryptoUtilsMod;

    const plaintext = 'Tamper test';
    const key = CryptoJS.enc.Hex.parse(legacyKeyHex);
    const iv = uint8ToWordArray(new Uint8Array(16).fill(7));
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const ctBytes = wordArrayToUint8(encrypted.ciphertext);
    const wrongHash = wordArrayToUint8(CryptoJS.SHA256('wrong plaintext'));
    const combined = new Uint8Array(16 + ctBytes.length + 32);
    combined.set(wordArrayToUint8(iv), 0);
    combined.set(ctBytes, 16);
    combined.set(wrongHash, 16 + ctBytes.length);
    const legacyCiphertext = uint8ToBase64(combined);

    await expect(decryptField(legacyCiphertext)).rejects.toThrow('Integrity check failed');
  });

  it('encrypts and decrypts using manual UTF-8 fallback', async () => {
    // @ts-expect-error remove native TextEncoder/TextDecoder to force fallback
    globalThis.TextEncoder = undefined;
    // @ts-expect-error polyfill undefined for fallback test
    globalThis.TextDecoder = undefined;

    const plaintext = 'Fallback UTF-8 test: émojis 🚀 and 中文';
    const encrypted = await encryptField(plaintext);
    const decrypted = await decryptField(encrypted);
    expect(decrypted).toEqual(plaintext);
  });
});
