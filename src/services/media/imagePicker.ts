import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  width: number | null;
  height: number | null;
  fileSize: number | null;
}

/** Request Media Library Permissions Async. */
export async function requestMediaLibraryPermissionsAsync(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return (status as string) === 'granted';
}

/** Pick Images From Library. */
export async function pickImagesFromLibrary(options?: {
  allowsMultipleSelection?: boolean;
}): Promise<PickedImage[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: options?.allowsMultipleSelection ?? true,
    quality: 1,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map((asset) => ({
    uri: asset.uri,
    width: asset.width ?? null,
    height: asset.height ?? null,
    fileSize: asset.fileSize ?? null,
  }));
}
