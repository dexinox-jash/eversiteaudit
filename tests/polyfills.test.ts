describe('polyfills', () => {
  it('polyfills crypto when missing', () => {
    const originalCrypto = global.crypto;
    // @ts-expect-error test polyfill path
    global.crypto = undefined;

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../src/polyfills');
    });

    global.crypto = originalCrypto;
  });

  it('polyfills randomUUID when missing', () => {
    const originalRandomUUID = global.crypto.randomUUID;
    // @ts-expect-error test polyfill path
    global.crypto.randomUUID = undefined;

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../src/polyfills');
    });

    global.crypto.randomUUID = originalRandomUUID;
  });
});
