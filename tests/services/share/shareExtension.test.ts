import { Share } from 'react-native';
import { shareProject, shareIssue, sharePhoto } from '@services/share/shareExtension';

describe('shareExtension', () => {
  let shareSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
  });

  afterEach(() => {
    shareSpy.mockRestore();
  });

  describe('shareProject', () => {
    it('shares a deep link to the project', async () => {
      await shareProject('proj-123');

      expect(shareSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('eversiteaudit://projects/proj-123'),
      });
    });

    it('includes descriptive message', async () => {
      await shareProject('proj-1');

      expect(shareSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('site audit project'),
      });
    });

    it('handles share cancellation silently', async () => {
      shareSpy.mockRejectedValue(new Error('User cancelled'));

      await expect(shareProject('proj-1')).resolves.toBeUndefined();
    });
  });

  describe('shareIssue', () => {
    it('shares a deep link to the issue', async () => {
      await shareIssue('issue-456');

      expect(shareSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('eversiteaudit://issues/issue-456'),
      });
    });

    it('includes issue type in message', async () => {
      await shareIssue('issue-1');

      expect(shareSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('issue'),
      });
    });
  });

  describe('sharePhoto', () => {
    it('shares a deep link to the photo', async () => {
      await sharePhoto('photo-789');

      expect(shareSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('eversiteaudit://photos/photo-789'),
        })
      );
    });

    it('includes photoPath as url when provided', async () => {
      await sharePhoto('photo-1', 'file:///photos/photo-1.jpg');

      expect(shareSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'file:///photos/photo-1.jpg',
        })
      );
    });

    it('passes undefined url when photoPath not provided', async () => {
      await sharePhoto('photo-1');

      expect(shareSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: undefined,
        })
      );
    });

    it('handles share error silently', async () => {
      shareSpy.mockRejectedValue(new Error('Failed'));

      await expect(sharePhoto('photo-1')).resolves.toBeUndefined();
    });
  });
});
