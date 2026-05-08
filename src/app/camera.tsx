import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  type CameraCapturedPicture,
  PermissionStatus,
} from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { X, SwitchCamera, Grid3x3, Zap, ZapOff } from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography, Toast, SkeletonCard } from '@components/index';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { hapticLight, hapticHeavy } from '@services/os/haptics';
import { usePhotoStore } from '@store/usePhotoStore';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { spacing, touchTargets } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  shouldShowBackupReminder,
  recordBackupReminderShown,
} from '@services/backup/reminderService';
import type { Photo, IssueSeverity } from '@/types/domain';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BURST_INTERVAL_MS = 333; // ~3 photos/second
const BURST_MAX_PHOTOS = 20;

export default function CameraScreen(): JSX.Element {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const SEVERITY_OPTIONS: {
    value: IssueSeverity;
    label: string;
    description: string;
    color: string;
  }[] = [
    {
      value: 'critical',
      label: 'Critical',
      description: 'Immediate action required. Safety hazard or structural failure.',
      color: colors.error,
    },
    {
      value: 'high',
      label: 'High',
      description: 'Serious concern. Needs attention within 24–48 hours.',
      color: colors.warning,
    },
    {
      value: 'medium',
      label: 'Medium',
      description: 'Moderate issue. Should be addressed within the week.',
      color: colors.success,
    },
    {
      value: 'low',
      label: 'Low',
      description: 'Minor observation. Can be scheduled for next maintenance.',
      color: colors.info,
    },
  ];
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [showGrid, setShowGrid] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isBursting, setIsBursting] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<Photo[]>([]);
  const [burstReviewPhotos, setBurstReviewPhotos] = useState<Photo[]>([]);
  const [burstReviewVisible, setBurstReviewVisible] = useState(false);
  const [severitySheetOpen, setSeveritySheetOpen] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<Photo | null>(null);
  const [backupToast, setBackupToast] = useState<string | null>(null);

  const { photos, createPhoto, updatePhoto } = usePhotoStore();
  const { createIssue, updateIssue } = useIssueStore();
  const { projects, loadProjects } = useProjectStore();
  const { projectId: queryProjectId, issueId: queryIssueId } = useLocalSearchParams<{
    projectId?: string;
    issueId?: string;
  }>();

  const selectedProjectId = queryProjectId ?? projects[0]?.id ?? null;

  const checkBackupReminder = useCallback(async (): Promise<boolean> => {
    const result = await shouldShowBackupReminder(photos.length);
    if (result.shouldShow && result.message) {
      setBackupToast(result.message);
      await recordBackupReminderShown();
      return true;
    }
    return false;
  }, [photos.length]);

  const navigateBackWithOptionalReminder = useCallback(async (): Promise<void> => {
    const shouldDelay = await checkBackupReminder();
    if (shouldDelay) {
      setTimeout(() => {
        setBackupToast(null);
        router.back();
      }, 2500);
    } else {
      router.back();
    }
  }, [checkBackupReminder]);

  const handleClose = useCallback((): void => {
    router.back();
  }, []);

  const toggleCameraFacing = useCallback((): void => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback((): void => {
    setFlash((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  }, []);

  const toggleGrid = useCallback((): void => {
    setShowGrid((prev) => !prev);
  }, []);

  const processAndSavePhoto = useCallback(
    async (photo: CameraCapturedPicture, issueId?: string | null): Promise<Photo> => {
      if (!selectedProjectId) {
        throw new Error('No project selected');
      }

      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      const MIN_FREE_SPACE_BYTES = 50 * 1024 * 1024; // 50 MB
      if (freeSpace < MIN_FREE_SPACE_BYTES) {
        Alert.alert('Storage full', 'Storage full — free space to save photos.');
        throw new Error('Storage full');
      }

      const photoId = crypto.randomUUID();
      const baseDir = `${FileSystem.documentDirectory}photos/${selectedProjectId}/`;
      await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });

      const originalPath = `${baseDir}${photoId}.jpg`;
      await FileSystem.copyAsync({ from: photo.uri, to: originalPath });

      const thumbnailResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      const thumbnailPath = `${baseDir}${photoId}_thumb.jpg`;
      await FileSystem.copyAsync({ from: thumbnailResult.uri, to: thumbnailPath });

      const compressedResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      const compressedPath = `${baseDir}${photoId}_compressed.jpg`;
      await FileSystem.copyAsync({ from: compressedResult.uri, to: compressedPath });

      const savedPhoto = await createPhoto({
        projectId: selectedProjectId,
        issueId: issueId ?? null,
        originalPath,
        thumbnailPath,
        compressedPath,
        width: photo.width,
        height: photo.height,
      });

      return savedPhoto;
    },
    [createPhoto, selectedProjectId]
  );

  const captureSinglePhoto = useCallback(async (): Promise<void> => {
    if (!cameraRef.current || !selectedProjectId || isCapturing) return;
    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      hapticLight();

      const savedPhoto = await processAndSavePhoto(photo, queryIssueId);

      setCapturedPhotos((prev) => [savedPhoto, ...prev].slice(0, 3));
      setPendingPhoto(savedPhoto);
      setIsCapturing(false);
      setSeveritySheetOpen(true);
    } catch (err) {
      console.error('Capture error:', err);
      setToast({ message: 'Failed to capture photo. Please try again.', variant: 'error' });
      setIsCapturing(false);
    }
  }, [isCapturing, processAndSavePhoto, queryIssueId, selectedProjectId]);

  const burstPhotosRef = useRef<Photo[]>([]);
  const burstTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isBurstingRef = useRef(false);

  const stopBurst = useCallback((): void => {
    isBurstingRef.current = false;
    setIsBursting(false);
    if (burstTimerRef.current) {
      clearTimeout(burstTimerRef.current);
      burstTimerRef.current = null;
    }
    if (burstPhotosRef.current.length > 0) {
      setBurstReviewPhotos(burstPhotosRef.current);
      setBurstReviewVisible(true);
    }
    setIsCapturing(false);
  }, []);

  const captureOneBurstPhoto = useCallback(async (): Promise<void> => {
    if (!cameraRef.current || !selectedProjectId || !isBurstingRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo?.uri) return;

      const savedPhoto = await processAndSavePhoto(photo, queryIssueId);
      burstPhotosRef.current = [...burstPhotosRef.current, savedPhoto];
      setBurstCount(burstPhotosRef.current.length);
      setCapturedPhotos((prev) => [savedPhoto, ...prev].slice(0, 3));

      if (burstPhotosRef.current.length >= BURST_MAX_PHOTOS) {
        stopBurst();
      }
    } catch (err) {
      console.error('Burst capture error:', err);
      setToast({ message: 'Burst capture failed. Please try again.', variant: 'error' });
    }
  }, [processAndSavePhoto, queryIssueId, selectedProjectId, stopBurst]);

  const startBurst = useCallback(async (): Promise<void> => {
    if (!cameraRef.current || !selectedProjectId || isBurstingRef.current) return;

    isBurstingRef.current = true;
    setIsBursting(true);
    burstPhotosRef.current = [];
    setBurstCount(0);
    hapticHeavy();

    await captureOneBurstPhoto();

    const scheduleNext = (): void => {
      if (!isBurstingRef.current || burstPhotosRef.current.length >= BURST_MAX_PHOTOS) {
        return;
      }
      burstTimerRef.current = setTimeout(() => {
        void captureOneBurstPhoto().then(() => {
          scheduleNext();
        });
      }, BURST_INTERVAL_MS);
    };

    scheduleNext();
  }, [captureOneBurstPhoto, selectedProjectId]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    return (): void => {
      if (burstTimerRef.current) {
        clearTimeout(burstTimerRef.current);
      }
    };
  }, []);

  const handleSeveritySelect = useCallback(
    async (severity: IssueSeverity): Promise<void> => {
      if (!pendingPhoto || !selectedProjectId) return;

      hapticLight();

      try {
        if (queryIssueId) {
          await updateIssue(queryIssueId, { severity });
        } else {
          const issue = await createIssue({
            projectId: selectedProjectId,
            title: `Issue from photo`,
            severity,
            status: 'open',
          });
          await updatePhoto(pendingPhoto.id, { issueId: issue.id });
        }
      } catch (err) {
        console.error('Severity tagging error:', err);
      }

      setSeveritySheetOpen(false);
      setPendingPhoto(null);
      setTimeout(() => {
        void navigateBackWithOptionalReminder();
      }, 150);
    },
    [
      createIssue,
      pendingPhoto,
      queryIssueId,
      selectedProjectId,
      updateIssue,
      updatePhoto,
      navigateBackWithOptionalReminder,
    ]
  );

  const handleSeveritySkip = useCallback((): void => {
    hapticLight();
    setSeveritySheetOpen(false);
    setPendingPhoto(null);
    setTimeout(() => {
      void navigateBackWithOptionalReminder();
    }, 150);
  }, [navigateBackWithOptionalReminder]);

  const navigateToPhoto = useCallback(
    (photoId: string): void => {
      const query = selectedProjectId ? `?projectId=${selectedProjectId}` : '';
      router.push(`/photos/${photoId}${query}`);
    },
    [selectedProjectId]
  );

  const handleBurstReviewDone = useCallback((): void => {
    setBurstReviewVisible(false);
    setBurstReviewPhotos([]);
    void navigateBackWithOptionalReminder();
  }, [navigateBackWithOptionalReminder]);

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ width: '80%' }}>
          <SkeletonCard lines={1} />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    const isDenied = 'status' in permission && permission.status === PermissionStatus.DENIED;
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Typography
          variant="headingSm"
          accessibilityRole="header"
          color="primary"
          style={styles.permissionTitle}
        >
          Camera Access
        </Typography>
        <Typography variant="body" color="secondary" style={styles.permissionText}>
          {isDenied
            ? 'Camera permission is denied. Please enable it in Settings to capture site photos.'
            : 'We need your permission to capture site photos.'}
        </Typography>
        <Pressable
          onPress={(): void => {
            if (isDenied) {
              void Linking.openSettings();
            } else {
              void requestPermission();
            }
          }}
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={isDenied ? 'Open device settings' : 'Grant camera permission'}
        >
          <Typography variant="bodyLarge" weight="semibold" color={colors.textPrimary}>
            {isDenied ? 'Open Settings' : 'Grant Permission'}
          </Typography>
        </Pressable>
        <Pressable
          onPress={handleClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Typography variant="body" color="secondary">
            Cancel
          </Typography>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} flash={flash}>
        <View style={[styles.overlay, { paddingBottom: insets.bottom + spacing['4'] }]}>
          {showGrid && (
            <View style={styles.gridOverlay} pointerEvents="none" accessibilityElementsHidden>
              <View
                testID="grid-line"
                style={[
                  styles.gridLine,
                  styles.gridLineVertical,
                  { left: '33.33%', backgroundColor: colors.textPrimary },
                ]}
              />
              <View
                testID="grid-line"
                style={[
                  styles.gridLine,
                  styles.gridLineVertical,
                  { left: '66.66%', backgroundColor: colors.textPrimary },
                ]}
              />
              <View
                testID="grid-line"
                style={[
                  styles.gridLine,
                  styles.gridLineHorizontal,
                  { top: '33.33%', backgroundColor: colors.textPrimary },
                ]}
              />
              <View
                testID="grid-line"
                style={[
                  styles.gridLine,
                  styles.gridLineHorizontal,
                  { top: '66.66%', backgroundColor: colors.textPrimary },
                ]}
              />
            </View>
          )}

          <View style={styles.topBar}>
            <View
              style={styles.topBarGroup}
              accessibilityLabel="Camera controls left"
              accessibilityRole="toolbar"
            >
              <Pressable
                onPress={handleClose}
                style={styles.iconButton}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close camera"
              >
                <X size={28} color={colors.textPrimary} />
              </Pressable>
              <Pressable
                onPress={toggleFlash}
                style={styles.iconButton}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={`Flash mode ${flash}`}
              >
                {flash === 'off' ? (
                  <ZapOff size={28} color={colors.textPrimary} />
                ) : (
                  <Zap size={28} color={flash === 'on' ? colors.warning : colors.textPrimary} />
                )}
              </Pressable>
            </View>
            <View
              style={styles.topBarGroup}
              accessibilityLabel="Camera controls right"
              accessibilityRole="toolbar"
            >
              <Pressable
                onPress={toggleGrid}
                style={styles.iconButton}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={showGrid ? 'Hide composition grid' : 'Show composition grid'}
                accessibilityHint="Double-tap to toggle the rule-of-thirds grid overlay"
                accessibilityState={{ selected: showGrid }}
              >
                <Grid3x3 size={28} color={showGrid ? colors.primary : colors.textPrimary} />
              </Pressable>
              <Pressable
                onPress={toggleCameraFacing}
                style={styles.iconButton}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Switch camera"
              >
                <SwitchCamera size={28} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {isBursting && (
            <View style={styles.burstIndicatorContainer}>
              <View style={[styles.burstIndicator, { backgroundColor: colors.error }]}>
                <Typography variant="caption" color={colors.textPrimary} weight="semibold">
                  BURST {burstCount}/{BURST_MAX_PHOTOS}
                </Typography>
              </View>
            </View>
          )}

          <View style={styles.bottomBar}>
            {capturedPhotos.length > 0 && (
              <View style={styles.photoStrip}>
                {capturedPhotos.map((photo, index) => (
                  <Pressable
                    key={photo.id}
                    onPress={(): void => navigateToPhoto(photo.id)}
                    style={styles.photoStripItem}
                    accessibilityRole="button"
                    accessibilityLabel={`View captured photo ${index + 1}`}
                  >
                    <Image source={{ uri: photo.thumbnailPath }} style={styles.photoStripImage} />
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable
              onPress={(): void => {
                captureSinglePhoto().catch(() => {
                  // ignore
                });
              }}
              onLongPress={(): void => {
                void startBurst();
              }}
              onPressOut={(): void => {
                if (isBurstingRef.current) {
                  stopBurst();
                }
              }}
              style={[
                styles.captureButton,
                { borderColor: colors.textPrimary },
                isBursting && { borderColor: colors.error },
              ]}
              disabled={isCapturing || !selectedProjectId}
              accessibilityRole="button"
              accessibilityLabel={isBursting ? 'Stop burst capture' : 'Take photo'}
              accessibilityHint={
                isBursting
                  ? 'Double-tap to stop burst capture'
                  : 'Double-tap to take a photo. Long press for burst mode'
              }
            >
              <View
                style={[
                  styles.captureInner,
                  { backgroundColor: colors.textPrimary },
                  isBursting && { backgroundColor: colors.error },
                ]}
              />
            </Pressable>
          </View>
        </View>
      </CameraView>

      {/* Severity Bottom Sheet */}
      {severitySheetOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          <Pressable
            style={[styles.backdrop, { backgroundColor: colors.scrim }]}
            onPress={handleSeveritySkip}
            accessibilityRole="button"
            accessibilityLabel="Close severity sheet"
          />
          <View
            style={[styles.severitySheet, { backgroundColor: colors.backgroundSecondary }]}
            accessibilityLabel="Tag severity"
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.textTertiary }]} />
            <Typography
              variant="headingSm"
              accessibilityRole="header"
              color="primary"
              style={styles.sheetTitle}
            >
              Tag Severity
            </Typography>
            <Typography variant="body" color="secondary" style={styles.sheetSubtitle}>
              {queryIssueId
                ? 'Select severity for this issue'
                : 'Create an issue and link this photo'}
            </Typography>

            <View
              style={styles.severityList}
              accessibilityRole="radiogroup"
              accessibilityLabel="Severity options"
            >
              {SEVERITY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={(): void => {
                    void handleSeveritySelect(option.value);
                  }}
                  style={[styles.severityOption, { borderColor: colors.border }]}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.label}: ${option.description}`}
                >
                  <View style={[styles.severityDot, { backgroundColor: option.color }]} />
                  <View style={styles.severityText}>
                    <Typography variant="body" color="primary" weight="semibold">
                      {option.label}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      {option.description}
                    </Typography>
                  </View>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleSeveritySkip}
              style={[styles.skipButton, { backgroundColor: colors.backgroundTertiary }]}
              accessibilityRole="button"
              accessibilityLabel="Skip severity tagging"
            >
              <Typography variant="body" color="primary" weight="semibold">
                Skip
              </Typography>
            </Pressable>
          </View>
        </View>
      )}

      {/* Backup Reminder Toast */}
      {backupToast ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          <View style={[styles.toastOverlay, { backgroundColor: colors.scrim }]}>
            <View style={[styles.toastCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Typography
                variant="headingSm"
                accessibilityRole="header"
                color="primary"
                style={styles.toastTitle}
              >
                Backup Reminder
              </Typography>
              <Typography variant="body" color="secondary" style={styles.toastMessage}>
                {backupToast}
              </Typography>
            </View>
          </View>
        </View>
      ) : null}

      {/* Burst Review Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={burstReviewVisible}
        onRequestClose={handleBurstReviewDone}
        accessibilityLabel="Burst review"
        accessibilityViewIsModal={true}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.scrim }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <Typography
              variant="headingSm"
              accessibilityRole="header"
              color="primary"
              style={styles.modalTitle}
            >
              Burst Review
            </Typography>
            <Typography variant="body" color="secondary" style={styles.modalSubtitle}>
              {burstReviewPhotos.length} photos captured
            </Typography>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              {burstReviewPhotos.map((photo, index) => (
                <Pressable
                  key={photo.id}
                  onPress={(): void => navigateToPhoto(photo.id)}
                  style={styles.modalPhotoItem}
                  accessibilityRole="button"
                  accessibilityLabel={`View burst photo ${index + 1}`}
                >
                  <Image source={{ uri: photo.thumbnailPath }} style={styles.modalPhotoImage} />
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={handleBurstReviewDone}
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Typography variant="bodyLarge" weight="semibold" color={colors.textPrimary}>
                Done
              </Typography>
            </Pressable>
          </View>
        </View>
      </Modal>
      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing['4'],
    paddingTop: spacing['6'],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing['4'],
  },
  iconButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  burstIndicatorContainer: {
    position: 'absolute',
    top: '15%',
    alignSelf: 'center',
  },
  burstIndicator: {
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    borderRadius: 16,
  },
  photoStrip: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing['4'],
  },
  photoStripItem: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoStripImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  permissionTitle: {
    marginBottom: spacing['2'],
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: spacing['6'],
    paddingHorizontal: spacing['6'],
  },
  permissionButton: {
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['6'],
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  closeButton: {
    marginTop: spacing['4'],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  severitySheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing['3'],
    paddingHorizontal: spacing['4'],
    paddingBottom: spacing['6'],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing['3'],
  },
  sheetTitle: {
    marginBottom: spacing['1'],
    textAlign: 'center',
  },
  sheetSubtitle: {
    textAlign: 'center',
    marginBottom: spacing['4'],
  },
  severityList: {
    gap: spacing['3'],
  },
  severityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
    padding: spacing['3'],
    borderRadius: 12,
    borderWidth: 1,
    minHeight: touchTargets.minimum,
  },
  severityDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  severityText: {
    flex: 1,
    gap: spacing['1'],
  },
  skipButton: {
    marginTop: spacing['4'],
    paddingVertical: spacing['3'],
    borderRadius: 12,
    alignItems: 'center',
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing['4'],
    paddingHorizontal: spacing['4'],
    paddingBottom: spacing['6'],
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: spacing['1'],
  },
  modalSubtitle: {
    textAlign: 'center',
    marginBottom: spacing['4'],
  },
  modalScroll: {
    gap: spacing['3'],
    paddingVertical: spacing['2'],
  },
  modalPhotoItem: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalPhotoImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  doneButton: {
    marginTop: spacing['4'],
    paddingVertical: spacing['3'],
    borderRadius: 12,
    alignItems: 'center',
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
  },
  toastOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['4'],
  },
  toastCard: {
    width: '100%',
    maxWidth: 320,
    padding: spacing['6'],
    borderRadius: 16,
    alignItems: 'center',
  },
  toastTitle: {
    marginBottom: spacing['2'],
    textAlign: 'center',
  },
  toastMessage: {
    textAlign: 'center',
  },
  topBarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  gridLine: {
    position: 'absolute',
    opacity: 0.5,
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
    top: 0,
  },
  gridLineHorizontal: {
    height: 1,
    width: '100%',
    left: 0,
  },
});
