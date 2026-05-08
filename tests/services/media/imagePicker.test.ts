import * as ImagePicker from 'expo-image-picker';
import {
  requestMediaLibraryPermissionsAsync,
  pickImagesFromLibrary,
} from '@services/media/imagePicker';

describe('imagePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestMediaLibraryPermissionsAsync', () => {
    it('returns true when permission is granted', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestMediaLibraryPermissionsAsync();
      expect(result).toBe(true);
    });

    it('returns false when permission is denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestMediaLibraryPermissionsAsync();
      expect(result).toBe(false);
    });
  });

  describe('pickImagesFromLibrary', () => {
    it('returns empty array when picker is canceled', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
        assets: [],
      });

      const result = await pickImagesFromLibrary();
      expect(result).toEqual([]);
    });

    it('maps assets to PickedImage array', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          { uri: 'file:///photo1.jpg', width: 1920, height: 1080, fileSize: 500000 },
          { uri: 'file:///photo2.jpg', width: 1280, height: 720, fileSize: 300000 },
        ],
      });

      const result = await pickImagesFromLibrary();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        uri: 'file:///photo1.jpg',
        width: 1920,
        height: 1080,
        fileSize: 500000,
      });
    });

    it('handles missing width/height/fileSize by mapping to null', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///photo1.jpg' }],
      });

      const result = await pickImagesFromLibrary();

      expect(result[0]).toEqual({
        uri: 'file:///photo1.jpg',
        width: null,
        height: null,
        fileSize: null,
      });
    });

    it('passes allowsMultipleSelection option through', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
        assets: [],
      });

      await pickImagesFromLibrary({ allowsMultipleSelection: false });

      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
        expect.objectContaining({ allowsMultipleSelection: false })
      );
    });

    it('defaults allowsMultipleSelection to true', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
        assets: [],
      });

      await pickImagesFromLibrary();

      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
        expect.objectContaining({ allowsMultipleSelection: true })
      );
    });
  });
});
