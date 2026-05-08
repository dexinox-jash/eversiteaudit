import { formatBytes } from '@utils/format';

describe('formatBytes', () => {
  it('returns 0 B for zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes into human readable sizes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });
});
