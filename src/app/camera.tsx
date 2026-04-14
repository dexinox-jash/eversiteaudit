import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { X, SwitchCamera } from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography } from '@components/index';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { usePhotoStore } from '@store/usePhotoStore';
import { useProjectStore } from '@store/useProjectStore';
import { spacing, touchTargets } from '@theme/index';

export default function CameraScreen(): JSX.Element {
  const { colors } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const { createPhoto } = usePhotoStore();
  const { projects } = useProjectStore();

  const selectedProjectId = projects[0]?.id ?? null;

  const handleClose = useCallback((): void => {
    router.back();
  }, []);

  const toggleCameraFacing = useCallback((): void => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  const capturePhoto = useCallback(async (): Promise<void> => {
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

      await createPhoto({
        projectId: selectedProjectId,
        originalPath,
        thumbnailPath,
        compressedPath,
        width: photo.width,
        height: photo.height,
      });

      router.back();
    } catch (err) {
      console.error('Capture error:', err);
      setIsCapturing(false);
    }
  }, [createPhoto, isCapturing, selectedProjectId]);



  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Typography variant="body" color="secondary">
          Loading camera permissions...
        </Typography>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Typography variant="h3" color="primary" style={styles.permissionTitle}>
          Camera Access
        </Typography>
        <Typography variant="body" color="secondary" style={styles.permissionText}>
          We need your permission to capture site photos.
        </Typography>
        <Pressable
          onPress={(): void => { void requestPermission(); }}
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
        >
          <Typography variant="bodyLarge" weight="semibold" color="#FFFFFF">
            Grant Permission
          </Typography>
        </Pressable>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Typography variant="body" color="secondary">
            Cancel
          </Typography>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <Pressable onPress={handleClose} style={styles.iconButton} hitSlop={12}>
              <X size={28} color="#FFFFFF" />
            </Pressable>
            <Pressable onPress={toggleCameraFacing} style={styles.iconButton} hitSlop={12}>
              <SwitchCamera size={28} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.bottomBar}>
            <Pressable
              onPress={(): void => {
                capturePhoto().catch(() => {
                  // ignore
                });
              }}
              style={[styles.captureButton, { borderColor: '#FFFFFF' }]}
              disabled={isCapturing || !selectedProjectId}
            >
              <View style={[styles.captureInner, { backgroundColor: '#FFFFFF' }]} />
            </Pressable>
          </View>
        </View>
      </CameraView>
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
    paddingBottom: spacing['6'],
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
});
