import {
  encryptWithPassphrase,
  decryptWithPassphrase,
  encryptKey,
  decryptKey,
} from '@services/backup/crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CryptoJS = require('crypto-js') as typeof import('crypto-js');
const cryptoUtils =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@services/security/cryptoUtils') as typeof import('@services/security/cryptoUtils');

describe('backup/crypto', () => {
  it('encrypts and decrypts a plaintext with a passphrase', async () => {
    const plaintext = 'Hello, backup world!';
    const passphrase = 'my-super-secret-passphrase';

    const encrypted = await encryptWithPassphrase(plaintext, passphrase);
    expect(encrypted).not.toEqual(plaintext);
    expect(typeof encrypted).toBe('string');
    expect(encrypted.startsWith('v2:')).toBe(true);

    const decrypted = await decryptWithPassphrase(encrypted, passphrase);
    expect(decrypted).toEqual(plaintext);
  });

  it('fails decryption with the wrong passphrase', async () => {
    const plaintext = 'Sensitive data';
    const passphrase = 'correct-passphrase';

    const encrypted = await encryptWithPassphrase(plaintext, passphrase);
    await expect(decryptWithPassphrase(encrypted, 'wrong-passphrase')).rejects.toThrow(
      'Backup decryption failed'
    );
  });

  it('fails decryption for malformed ciphertext', async () => {
    await expect(decryptWithPassphrase('not-valid-base64!!!', 'passphrase')).rejects.toThrow(
      'Backup decryption failed'
    );
  });

  it('round-trips through encryptKey / decryptKey', async () => {
    const keyHex = 'a'.repeat(64);
    const passphrase = 'another-passphrase';

    const wrapped = await encryptKey(keyHex, passphrase);
    expect(wrapped.startsWith('v2:')).toBe(true);
    const unwrapped = await decryptKey(wrapped, passphrase);
    expect(unwrapped).toEqual(keyHex);
  });

  it('rejects v2 ciphertext with a tampered authentication tag', async () => {
    const encrypted = await encryptWithPassphrase('cannot be tampered', 'p4ssword!!');
    const body = encrypted.slice('v2:'.length);
    // Decode, flip the very last byte of the GCM auth tag, re-encode.
    const bytes = cryptoUtils.base64ToUint8(body);
    bytes[bytes.length - 1] = bytes[bytes.length - 1]! ^ 0xff;
    const tampered = 'v2:' + cryptoUtils.uint8ToBase64(bytes);
    await expect(decryptWithPassphrase(tampered, 'p4ssword!!')).rejects.toThrow(
      'Backup decryption failed'
    );
  });

  it('rejects v2 ciphertext shorter than salt + IV + tag', async () => {
    await expect(decryptWithPassphrase('v2:AAAA', 'anything')).rejects.toThrow(
      'Backup decryption failed'
    );
  });

  it('decrypts a legacy v1 CBC + SHA-256 backup ciphertext (read-side back-compat)', async () => {
    // Recreate the pre-v2 construction exactly: PBKDF2 → AES-256-CBC + SHA-256(plaintext),
    // packed as base64(salt16 ‖ iv16 ‖ ct ‖ hash32) with NO `v2:` prefix so
    // decryptWithPassphrase dispatches to the legacy path.
    const plaintext = 'Legacy backup payload';
    const passphrase = 'legacy-pass';
    const salt = new Uint8Array(16).fill(1);
    const iv = new Uint8Array(16).fill(2);

    const key = CryptoJS.PBKDF2(passphrase, cryptoUtils.uint8ToWordArray(salt), {
      keySize: 256 / 32,
      iterations: 100_000,
    });
    const ivWa = cryptoUtils.uint8ToWordArray(iv);
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: ivWa,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const ctBytes = cryptoUtils.wordArrayToUint8(encrypted.ciphertext);
    const hashBytes = cryptoUtils.wordArrayToUint8(CryptoJS.SHA256(plaintext));

    const combined = new Uint8Array(16 + 16 + ctBytes.length + 32);
    combined.set(salt, 0);
    combined.set(iv, 16);
    combined.set(ctBytes, 32);
    combined.set(hashBytes, 32 + ctBytes.length);
    const legacyCiphertext = cryptoUtils.uint8ToBase64(combined);
    expect(legacyCiphertext.startsWith('v2:')).toBe(false);

    const decrypted = await decryptWithPassphrase(legacyCiphertext, passphrase);
    expect(decrypted).toEqual(plaintext);
  });

  it('round-trips unicode text correctly', async () => {
    const plaintext = '日本語 🔒 passphrase test';
    const encrypted = await encryptWithPassphrase(plaintext, 'some-pass');
    const decrypted = await decryptWithPassphrase(encrypted, 'some-pass');
    expect(decrypted).toEqual(plaintext);
  });

  it('round-trips using manual UTF-8 fallback', async () => {
    const originalTextEncoder = globalThis.TextEncoder;
    const originalTextDecoder = globalThis.TextDecoder;
    // @ts-expect-error force fallback
    globalThis.TextEncoder = undefined;
    // @ts-expect-error polyfill undefined for fallback test
    globalThis.TextDecoder = undefined;

    const plaintext = 'Fallback UTF-8: émojis 🚀 and 中文';
    const encrypted = await encryptWithPassphrase(plaintext, 'fallback-pass');
    const decrypted = await decryptWithPassphrase(encrypted, 'fallback-pass');
    expect(decrypted).toEqual(plaintext);

    globalThis.TextEncoder = originalTextEncoder;
    globalThis.TextDecoder = originalTextDecoder;
  });

  it('rejects legacy v1 ciphertext with tampered integrity hash', async () => {
    const plaintext = 'Legacy payload';
    const passphrase = 'legacy-pass';
    const salt = new Uint8Array(16).fill(1);
    const iv = new Uint8Array(16).fill(2);

    const key = CryptoJS.PBKDF2(passphrase, cryptoUtils.uint8ToWordArray(salt), {
      keySize: 256 / 32,
      iterations: 100_000,
    });
    const ivWa = cryptoUtils.uint8ToWordArray(iv);
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: ivWa,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const ctBytes = cryptoUtils.wordArrayToUint8(encrypted.ciphertext);
    const hashBytes = cryptoUtils.wordArrayToUint8(CryptoJS.SHA256('wrong-plaintext'));

    const combined = new Uint8Array(16 + 16 + ctBytes.length + 32);
    combined.set(salt, 0);
    combined.set(iv, 16);
    combined.set(ctBytes, 32);
    combined.set(hashBytes, 32 + ctBytes.length);
    const tamperedLegacy = cryptoUtils.uint8ToBase64(combined);

    await expect(decryptWithPassphrase(tamperedLegacy, passphrase)).rejects.toThrow(
      'Backup decryption failed'
    );
  });
});
