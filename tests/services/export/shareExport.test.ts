import * as Sharing from 'expo-sharing';
import { shareFile, getMimeTypeFromPath, joinPath, computeSha256 } from '@services/export/shareExport';

describe('shareFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls shareAsync with correct URI and mimeType for PDF', async () => {
    const result = {
      filePath: 'file:///mock/test.pdf',
      fileSize: 1234,
      checksum: 'abc',
      mimeType: 'application/pdf',
    };

    await shareFile(result);

    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///mock/test.pdf', {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });
  });

  it('determines mimeType correctly for .zip', async () => {
    const result = {
      filePath: 'file:///mock/export.zip',
      fileSize: 1234,
      checksum: 'abc',
    };

    await shareFile(result);

    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///mock/export.zip', {
      mimeType: 'application/zip',
      UTI: 'com.pkware.zip-archive',
    });
  });

  it('determines mimeType correctly for .json', async () => {
    const result = {
      filePath: 'file:///mock/data.json',
      fileSize: 1234,
      checksum: 'abc',
    };

    await shareFile(result);

    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///mock/data.json', {
      mimeType: 'application/json',
      UTI: 'public.json',
    });
  });

  it('determines mimeType correctly for .csv', async () => {
    const result = {
      filePath: 'file:///mock/data.csv',
      fileSize: 1234,
      checksum: 'abc',
    };

    await shareFile(result);

    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///mock/data.csv', {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
    });
  });
});

describe('getMimeTypeFromPath', () => {
  it('returns application/octet-stream for unknown extensions', () => {
    expect(getMimeTypeFromPath('file:///mock/data.unknown')).toBe('application/octet-stream');
  });

  it('returns correct mime types for known extensions', () => {
    expect(getMimeTypeFromPath('file:///mock/data.pdf')).toBe('application/pdf');
    expect(getMimeTypeFromPath('file:///mock/data.json')).toBe('application/json');
    expect(getMimeTypeFromPath('file:///mock/data.csv')).toBe('text/csv');
    expect(getMimeTypeFromPath('file:///mock/data.zip')).toBe('application/zip');
  });
});

describe('joinPath', () => {
  it('returns fileName when dir is null or undefined', () => {
    expect(joinPath(null, 'file.txt')).toBe('file.txt');
    expect(joinPath(undefined, 'file.txt')).toBe('file.txt');
  });

  it('joins dir and fileName with a single slash', () => {
    expect(joinPath('/path', 'file.txt')).toBe('/path/file.txt');
    expect(joinPath('/path/', 'file.txt')).toBe('/path/file.txt');
  });
});

describe('shareFile error paths', () => {
  it('throws when Sharing.shareAsync fails', async () => {
    (Sharing.shareAsync as jest.Mock).mockRejectedValue(new Error('User cancelled'));

    await expect(shareFile('file:///mock/test.pdf')).rejects.toThrow('Sharing failed');
  });

  it('shares string URI directly', async () => {
    (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

    await shareFile('file:///mock/test.bin');

    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///mock/test.bin', {
      mimeType: 'application/octet-stream',
      UTI: 'public.data',
    });
  });
});

describe('computeSha256', () => {
  it('returns a 64-character hex string', async () => {
    const hash = await computeSha256('hello');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});
