import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

let currentRecording: Audio.Recording | null = null;

/** Request Audio Permissions Async. */
export async function requestAudioPermissionsAsync(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return (status as string) === 'granted';
}

/** Start Recording. */
export async function startRecording(): Promise<void> {
  if (currentRecording) {
    await stopRecording();
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  currentRecording = recording;
}

/** Stop Recording. */
export async function stopRecording(): Promise<string | null> {
  if (!currentRecording) return null;

  await currentRecording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
  });

  const uri = currentRecording.getURI();
  currentRecording = null;
  return uri;
}

/** Delete Recording. */
export async function deleteRecording(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri);
    }
  } catch {
    // ignore
  }
}

/** Get Recording Duration. */
export async function getRecordingDuration(recording: Audio.Recording): Promise<number> {
  const status = await recording.getStatusAsync();
  return (status as { durationMillis?: number }).durationMillis ?? 0;
}
