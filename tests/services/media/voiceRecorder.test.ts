import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Patch RecordingOptionsPresets onto the mock
(Audio as Record<string, unknown>).RecordingOptionsPresets = {
  HIGH_QUALITY: { android: {}, ios: {}, web: {} },
};

import {
  requestAudioPermissionsAsync,
  startRecording,
  deleteRecording,
  getRecordingDuration,
} from '@services/media/voiceRecorder';

describe('voiceRecorder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestAudioPermissionsAsync', () => {
    it('returns true when permission is granted', async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      const result = await requestAudioPermissionsAsync();
      expect(result).toBe(true);
    });

    it('returns false when permission is denied', async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      const result = await requestAudioPermissionsAsync();
      expect(result).toBe(false);
    });
  });

  describe('startRecording', () => {
    it('creates a recording via Audio.Recording.createAsync', async () => {
      const mockRecording = {
        stopAndUnloadAsync: jest.fn(),
        getURI: jest.fn(() => 'file:///recording.m4a'),
        getStatusAsync: jest.fn(),
      };
      (Audio.Recording.createAsync as jest.Mock).mockResolvedValue({ recording: mockRecording });

      await startRecording();

      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith(
        expect.objectContaining({ allowsRecordingIOS: true })
      );
      expect(Audio.Recording.createAsync).toHaveBeenCalled();
    });

    it('stops existing recording before starting a new one', async () => {
      jest.resetModules();

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const av = require('expo-av');
      av.Audio.RecordingOptionsPresets = { HIGH_QUALITY: {} };

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const freshModule = require('@services/media/voiceRecorder');
      const mockRecording = {
        stopAndUnloadAsync: jest.fn(),
        getURI: jest.fn(() => 'file:///first.m4a'),
        getStatusAsync: jest.fn(),
      };
      (av.Audio.Recording.createAsync as jest.Mock).mockResolvedValue({ recording: mockRecording });

      await freshModule.startRecording();
      await freshModule.startRecording();

      expect(mockRecording.stopAndUnloadAsync).toHaveBeenCalled();
    });
  });

  describe('stopRecording', () => {
    it('returns null if no active recording', async () => {
      // Fresh module — no recording started yet in this test
      jest.resetModules();

      // Re-patch the preset
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const av = require('expo-av');
      av.Audio.RecordingOptionsPresets = { HIGH_QUALITY: {} };

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const freshModule = require('@services/media/voiceRecorder');
      const result = await freshModule.stopRecording();
      expect(result).toBeNull();
    });

    it('stops and returns uri when there is an active recording', async () => {
      jest.resetModules();

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const av = require('expo-av');
      av.Audio.RecordingOptionsPresets = { HIGH_QUALITY: {} };

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const freshModule = require('@services/media/voiceRecorder');
      const mockRecording = {
        stopAndUnloadAsync: jest.fn(),
        getURI: jest.fn(() => 'file:///recording.m4a'),
        getStatusAsync: jest.fn(),
      };
      (av.Audio.Recording.createAsync as jest.Mock).mockResolvedValue({ recording: mockRecording });

      await freshModule.startRecording();
      const result = await freshModule.stopRecording();

      expect(mockRecording.stopAndUnloadAsync).toHaveBeenCalled();
      expect(result).toBe('file:///recording.m4a');
    });
  });

  describe('deleteRecording', () => {
    it('deletes file when it exists', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

      await deleteRecording('file:///recording.m4a');

      expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///recording.m4a');
    });

    it('does nothing when file does not exist', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

      await deleteRecording('file:///nonexistent.m4a');

      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });

    it('ignores errors silently', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(new Error('Disk error'));

      await expect(deleteRecording('file:///bad.m4a')).resolves.toBeUndefined();
    });
  });

  describe('getRecordingDuration', () => {
    it('returns durationMillis from recording status', async () => {
      const mockRecording = {
        getStatusAsync: jest.fn().mockResolvedValue({ durationMillis: 15000 }),
      } as unknown as Audio.Recording;

      const duration = await getRecordingDuration(mockRecording);
      expect(duration).toBe(15000);
    });

    it('returns 0 when durationMillis is undefined', async () => {
      const mockRecording = {
        getStatusAsync: jest.fn().mockResolvedValue({}),
      } as unknown as Audio.Recording;

      const duration = await getRecordingDuration(mockRecording);
      expect(duration).toBe(0);
    });
  });
});
