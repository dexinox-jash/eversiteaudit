import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ChevronLeft,
  Share2,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  MapPin,
  Camera,
  Calendar,
  Tag,
  Info,
  Pencil,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography, Button, TextInput, Toast } from '@components/index';
import { usePhotoStore } from '@store/usePhotoStore';
import { useAnnotationStore } from '@store/useAnnotationStore';
import type { Annotation } from '../../types/domain';
import { spacing, radius } from '@theme/index';
import Svg, {
  Line,
  Circle as SvgCircle,
  Rect as SvgRect,
  Polyline,
  Polygon,
  Text as SvgText,
} from 'react-native-svg';
import { formatBytes } from '@utils/format';
import { sharePhoto } from '@services/share/shareExtension';
import { photoRepository } from '@services/db/repositories';
import {
  pickImagesFromLibrary,
  requestMediaLibraryPermissionsAsync,
} from '@services/media/imagePicker';
import { verifyFileChecksum } from '@services/integrity/photoIntegrity';
import { hapticWarning, hapticSuccess, hapticError } from '@services/os/haptics';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function PhotoViewerScreen(): JSX.Element {
  const { id, issueId, projectId } = useLocalSearchParams<{
    id: string;
    issueId?: string;
    projectId?: string;
  }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { photos, deletePhoto, createPhoto } = usePhotoStore();
  const { annotations, loadAnnotations } = useAnnotationStore();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });

  const photo = useMemo(() => photos.find((p) => p.id === id), [photos, id]);

  const [caption, setCaption] = useState('');
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setCaption(photo?.caption ?? '');
  }, [photo?.caption]);

  const contextPhotos = useMemo(() => {
    if (issueId) {
      return photos
        .filter((p) => p.issueId === issueId)
        .sort((a, b) => (b.captureTimestamp ?? b.createdAt) - (a.captureTimestamp ?? a.createdAt));
    }
    if (projectId) {
      return photos
        .filter((p) => p.projectId === projectId)
        .sort((a, b) => (b.captureTimestamp ?? b.createdAt) - (a.captureTimestamp ?? a.createdAt));
    }
    return [];
  }, [photos, issueId, projectId]);

  const currentIndex = useMemo(
    () => contextPhotos.findIndex((p) => p.id === id),
    [contextPhotos, id]
  );

  const navigateToPhoto = useCallback(
    (targetId: string) => {
      const query = issueId ? `?issueId=${issueId}` : projectId ? `?projectId=${projectId}` : '';
      router.replace(`/photos/${targetId}${query}`);
    },
    [issueId, projectId]
  );

  const handlePrev = useCallback(() => {
    if (contextPhotos.length === 0) return;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : contextPhotos.length - 1;
    navigateToPhoto(contextPhotos[prevIndex]!.id);
  }, [contextPhotos, currentIndex, navigateToPhoto]);

  const handleNext = useCallback(() => {
    if (contextPhotos.length === 0) return;
    const nextIndex = currentIndex < contextPhotos.length - 1 ? currentIndex + 1 : 0;
    navigateToPhoto(contextPhotos[nextIndex]!.id);
  }, [contextPhotos, currentIndex, navigateToPhoto]);

  const handleShare = useCallback(async (): Promise<void> => {
    if (!photo) return;
    try {
      await sharePhoto(photo.id, photo.originalPath);
    } catch {
      // ignore
    }
  }, [photo]);

  const handleDelete = useCallback((): void => {
    if (!photo) return;
    hapticWarning();
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: (): void => {
          void deletePhoto(photo.id);
          router.back();
        },
      },
    ]);
  }, [photo, deletePhoto]);

  const handleSaveCaption = useCallback(async (): Promise<void> => {
    if (!photo) return;
    setIsSavingCaption(true);
    try {
      await photoRepository.update(photo.id, { caption: caption.trim() || null });
      setToastMessage('Caption saved');
    } catch {
      setToastMessage('Failed to save caption');
    } finally {
      setIsSavingCaption(false);
    }
  }, [photo, caption]);

  const handleImportFromGallery = useCallback(async (): Promise<void> => {
    if (!photo) return;
    const granted = await requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Denied', 'Media library permission is required to import photos.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ]);
      return;
    }
    const images = await pickImagesFromLibrary({ allowsMultipleSelection: true });
    if (images.length === 0) return;
    for (const img of images) {
      await createPhoto({
        projectId: projectId ?? photo.projectId,
        issueId: issueId ?? null,
        originalPath: img.uri,
        thumbnailPath: img.uri,
        width: img.width,
        height: img.height,
        fileSizeBytes: img.fileSize,
      });
    }
    setToastMessage(`${images.length} photo(s) imported`);
  }, [photo, projectId, issueId, createPhoto]);

  const handleVerifyIntegrity = useCallback(async (): Promise<void> => {
    if (!photo) return;
    if (!photo.checksum) {
      setToastMessage('No checksum available');
      return;
    }
    const valid = await verifyFileChecksum(photo.originalPath, photo.checksum);
    if (valid) {
      hapticSuccess();
      setToastMessage('Integrity verified');
    } else {
      hapticError();
      setToastMessage('Integrity check failed');
    }
  }, [photo]);

  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  useEffect(() => {
    if (id) {
      void loadAnnotations(id);
    }
  }, [id, loadAnnotations]);

  const tags = useMemo<string[]>(() => {
    if (!photo) return [];
    try {
      return JSON.parse(photo.tags) as string[];
    } catch {
      return [];
    }
  }, [photo]);

  const imageBounds = useMemo(() => {
    const containerWidth = imageLayout.width || SCREEN_HEIGHT;
    const containerHeight = imageLayout.height || SCREEN_HEIGHT;
    const imgW = photo?.width ?? null;
    const imgH = photo?.height ?? null;
    if (!imgW || !imgH || imgW <= 0 || imgH <= 0) {
      return { left: 0, top: 0, width: containerWidth, height: containerHeight };
    }
    const containerRatio = containerWidth / containerHeight;
    const imageRatio = imgW / imgH;
    if (imageRatio > containerRatio) {
      const width = containerWidth;
      const height = containerWidth / imageRatio;
      return { left: 0, top: (containerHeight - height) / 2, width, height };
    }
    const height = containerHeight;
    const width = containerHeight * imageRatio;
    return { left: (containerWidth - width) / 2, top: 0, width, height };
  }, [imageLayout, photo?.width, photo?.height]);

  const fromNormalized = useCallback(
    (nx: number, ny: number): { x: number; y: number } => {
      return {
        x: nx * imageBounds.width + imageBounds.left,
        y: ny * imageBounds.height + imageBounds.top,
      };
    },
    [imageBounds]
  );

  const renderAnnotationSvg = useCallback(
    (ann: Annotation) => {
      const p1 = fromNormalized(ann.x, ann.y);
      const sw = ann.strokeWidth;

      if (ann.type === 'arrow' && ann.width !== null && ann.height !== null) {
        const p2 = fromNormalized(ann.width, ann.height);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const arrowLen = 12;
        const arrowAngle = Math.PI / 6;
        const x3 = p2.x - arrowLen * Math.cos(angle - arrowAngle);
        const y3 = p2.y - arrowLen * Math.sin(angle - arrowAngle);
        const x4 = p2.x - arrowLen * Math.cos(angle + arrowAngle);
        const y4 = p2.y - arrowLen * Math.sin(angle + arrowAngle);
        return (
          <React.Fragment key={ann.id}>
            <Line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ann.color} strokeWidth={sw} />
            <Polygon points={`${p2.x},${p2.y} ${x3},${y3} ${x4},${y4}`} fill={ann.color} />
          </React.Fragment>
        );
      }

      if (ann.type === 'circle' && ann.width !== null) {
        const r = ann.width * Math.min(imageBounds.width, imageBounds.height);
        return (
          <SvgCircle cx={p1.x} cy={p1.y} r={r} stroke={ann.color} strokeWidth={sw} fill="none" />
        );
      }

      if (ann.type === 'rectangle' && ann.width !== null && ann.height !== null) {
        const rw = ann.width * imageBounds.width;
        const rh = ann.height * imageBounds.height;
        return (
          <SvgRect
            x={p1.x}
            y={p1.y}
            width={rw}
            height={rh}
            stroke={ann.color}
            strokeWidth={sw}
            fill="none"
          />
        );
      }

      if (ann.type === 'highlight' && ann.textContent) {
        try {
          const parsed = JSON.parse(ann.textContent) as unknown;
          const points = Array.isArray(parsed) ? (parsed as Array<{ x: number; y: number }>) : [];
          const pts = points
            .map((pt) => {
              const sp = fromNormalized(pt.x, pt.y);
              return `${sp.x},${sp.y}`;
            })
            .join(' ');
          return (
            <Polyline
              key={ann.id}
              points={pts}
              fill="none"
              stroke={ann.color}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        } catch {
          return null;
        }
      }

      if (ann.type === 'text' && ann.textContent) {
        const fontSize = ann.fontSize ?? 16;
        return (
          <SvgText
            key={ann.id}
            x={p1.x}
            y={p1.y}
            fill={ann.color}
            fontSize={fontSize}
            fontWeight="600"
          >
            {ann.textContent}
          </SvgText>
        );
      }

      return null;
    },
    [imageBounds, fromNormalized]
  );

  if (!photo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { top: insets.top }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconButton}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={28} color={colors.textPrimary} />
          </Pressable>
        </View>
        <Typography variant="body" color="secondary">
          Photo not found
        </Typography>
      </View>
    );
  }

  const imageContent = (
    <View
      style={styles.flex}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setImageLayout({ width, height });
      }}
      accessibilityRole="image"
      accessibilityLabel="Photo with annotations"
    >
      <Image
        source={{ uri: photo.originalPath }}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel="Photo"
      />
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {annotations.map((ann) => renderAnnotationSvg(ann))}
      </Svg>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS === 'ios' ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.flex}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          {imageContent}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{imageContent}</View>
      )}

      {/* Top Controls */}
      <View style={[styles.topBar, { top: insets.top + spacing['2'] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.circleButton, { backgroundColor: colors.scrim }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.topBarRight}>
          <Pressable
            onPress={() => router.push(`/photos/annotate/${id}`)}
            style={[styles.circleButton, { backgroundColor: colors.scrim }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Annotate photo"
          >
            <Pencil size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => {
              void handleShare();
            }}
            style={[styles.circleButton, { backgroundColor: colors.scrim }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Share photo"
          >
            <Share2 size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={[styles.circleButton, { backgroundColor: colors.scrim }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Delete photo"
          >
            <Trash2 size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={[styles.bottomBar, { bottom: insets.bottom + spacing['4'] }]}>
        {contextPhotos.length > 1 && (
          <View style={styles.navRow}>
            <Pressable
              onPress={handlePrev}
              style={[styles.navButton, { backgroundColor: colors.scrim }]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Previous photo"
            >
              <PrevIcon size={20} color={colors.textPrimary} />
              <Typography variant="bodySmall" color={colors.textPrimary}>
                Prev
              </Typography>
            </Pressable>
            <Typography
              variant="caption"
              color={colors.textPrimary}
              style={[styles.pageIndicator, { backgroundColor: colors.scrim }]}
              accessibilityLabel={`Photo ${currentIndex + 1} of ${contextPhotos.length}`}
            >
              {currentIndex + 1} / {contextPhotos.length}
            </Typography>
            <Pressable
              onPress={handleNext}
              style={[styles.navButton, { backgroundColor: colors.scrim }]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Next photo"
            >
              <Typography variant="bodySmall" color={colors.textPrimary}>
                Next
              </Typography>
              <NextIcon size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
        )}
        <Pressable
          onPress={togglePanel}
          style={[styles.infoButton, { backgroundColor: colors.scrim }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={isPanelOpen ? 'Hide photo information' : 'Show photo information'}
        >
          {isPanelOpen ? (
            <ChevronDown size={18} color={colors.textPrimary} />
          ) : (
            <ChevronUp size={18} color={colors.textPrimary} />
          )}
          <Typography variant="bodySmall" color={colors.textPrimary} style={styles.infoButtonText}>
            {isPanelOpen ? 'Hide Info' : 'Show Info'}
          </Typography>
        </Pressable>
      </View>

      {/* Metadata Panel */}
      {isPanelOpen && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>
          <Pressable
            style={[styles.backdrop, { backgroundColor: colors.scrim }]}
            onPress={closePanel}
            accessibilityRole="button"
            accessibilityLabel="Close photo details"
          />
          <View
            style={[
              styles.panel,
              {
                backgroundColor: colors.backgroundSecondary,
                paddingBottom: insets.bottom + spacing['4'],
              },
            ]}
            accessibilityLabel="Photo details"
          >
            <View style={styles.panelHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.panelContent}>
                <Typography
                  variant="headingSm"
                  accessibilityRole="header"
                  color="primary"
                  style={styles.panelTitle}
                >
                  Photo Details
                </Typography>

                <View style={styles.captionSection}>
                  {photo.caption ? (
                    <Typography variant="body" color="primary">
                      {photo.caption}
                    </Typography>
                  ) : null}
                  <TextInput
                    label="Caption"
                    placeholder="Enter caption..."
                    value={caption}
                    onChangeText={setCaption}
                    editable={!isSavingCaption}
                  />
                  <Button
                    title="Save Caption"
                    onPress={() => void handleSaveCaption()}
                    disabled={isSavingCaption}
                    loading={isSavingCaption}
                    size="small"
                  />
                </View>

                {photo.captureTimestamp ? (
                  <View style={styles.metaRow}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <View style={styles.metaText}>
                      <Typography variant="caption" color="secondary">
                        Captured
                      </Typography>
                      <Typography variant="body" color="primary">
                        {new Date(photo.captureTimestamp).toLocaleString()}
                      </Typography>
                    </View>
                  </View>
                ) : null}

                {photo.cameraMake || photo.cameraModel ? (
                  <View style={styles.metaRow}>
                    <Camera size={16} color={colors.textSecondary} />
                    <View style={styles.metaText}>
                      <Typography variant="caption" color="secondary">
                        Camera
                      </Typography>
                      <Typography variant="body" color="primary">
                        {[photo.cameraMake, photo.cameraModel].filter(Boolean).join(' ')}
                      </Typography>
                    </View>
                  </View>
                ) : null}

                {photo.width && photo.height ? (
                  <View style={styles.metaRow}>
                    <Info size={16} color={colors.textSecondary} />
                    <View style={styles.metaText}>
                      <Typography variant="caption" color="secondary">
                        Dimensions
                      </Typography>
                      <Typography variant="body" color="primary">
                        {photo.width} × {photo.height}
                      </Typography>
                    </View>
                  </View>
                ) : null}

                {photo.fileSizeBytes ? (
                  <View style={styles.metaRow}>
                    <Info size={16} color={colors.textSecondary} />
                    <View style={styles.metaText}>
                      <Typography variant="caption" color="secondary">
                        File Size
                      </Typography>
                      <Typography variant="body" color="primary">
                        {formatBytes(photo.fileSizeBytes)}
                      </Typography>
                    </View>
                  </View>
                ) : null}

                {photo.gpsLatitude !== null && photo.gpsLongitude !== null ? (
                  <View style={styles.metaRow}>
                    <MapPin size={16} color={colors.textSecondary} />
                    <View style={styles.metaText}>
                      <Typography variant="caption" color="secondary">
                        Location
                      </Typography>
                      <Typography variant="body" color="primary">
                        {photo.gpsLatitude.toFixed(6)}, {photo.gpsLongitude.toFixed(6)}
                        {photo.gpsAltitude !== null ? ` • ${photo.gpsAltitude.toFixed(1)}m` : ''}
                      </Typography>
                    </View>
                  </View>
                ) : null}

                {tags.length > 0 ? (
                  <View style={styles.metaRow}>
                    <Tag size={16} color={colors.textSecondary} />
                    <View style={styles.metaText}>
                      <Typography variant="caption" color="secondary">
                        Tags
                      </Typography>
                      <Typography variant="body" color="primary">
                        {tags.join(', ')}
                      </Typography>
                    </View>
                  </View>
                ) : null}

                <View style={styles.metaRow}>
                  <Info size={16} color={colors.textSecondary} />
                  <View style={styles.metaText}>
                    <Typography variant="caption" color="secondary">
                      Created
                    </Typography>
                    <Typography variant="body" color="primary">
                      {new Date(photo.createdAt).toLocaleString()}
                    </Typography>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Info size={16} color={colors.textSecondary} />
                  <View style={styles.metaText}>
                    <Typography variant="caption" color="secondary">
                      Updated
                    </Typography>
                    <Typography variant="body" color="primary">
                      {new Date(photo.updatedAt).toLocaleString()}
                    </Typography>
                  </View>
                </View>

                <View style={styles.importSection}>
                  <Button
                    title="Verify Integrity"
                    onPress={() => void handleVerifyIntegrity()}
                    icon={ShieldCheck}
                    variant="secondary"
                    size="small"
                  />
                  <Button
                    title="Import from Gallery"
                    onPress={() => void handleImportFromGallery()}
                    icon={ImageIcon}
                    variant="secondary"
                    size="small"
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {toastMessage ? (
        <Toast
          message={toastMessage}
          variant={toastMessage.includes('Failed') ? 'error' : 'success'}
          onDismiss={() => setToastMessage(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['4'],
    zIndex: 5,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing['4'],
    zIndex: 5,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing['3'],
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['2'],
    borderRadius: radius.lg,
  },
  pageIndicator: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
    borderRadius: radius.lg,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    borderRadius: radius.lg,
  },
  infoButtonText: {
    marginLeft: spacing['1'],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing['3'],
  },
  panelHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.5)',
    alignSelf: 'center',
    marginBottom: spacing['3'],
  },
  panelContent: {
    paddingHorizontal: spacing['5'],
    paddingTop: spacing['2'],
    paddingBottom: spacing['6'],
    gap: spacing['4'],
  },
  panelTitle: {
    marginBottom: spacing['2'],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing['3'],
  },
  metaText: {
    flex: 1,
    gap: spacing['1'],
  },
  captionSection: {
    gap: spacing['2'],
  },
  importSection: {
    marginTop: spacing['2'],
  },
});
