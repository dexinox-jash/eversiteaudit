import { randomUUID } from 'expo-crypto';

const g = global as typeof globalThis & { crypto?: Crypto };

if (typeof g.crypto === 'undefined') {
  g.crypto = {} as Crypto;
}

if (!g.crypto.randomUUID) {
  Object.defineProperty(g.crypto, 'randomUUID', {
    value: (): string => randomUUID(),
    writable: true,
    configurable: true,
  });
}
