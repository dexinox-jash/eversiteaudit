import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  RefreshControl,
  LayoutAnimation,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Pencil,
  Image as ImageIcon,
  Camera,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  X,
  Check,
  Trash2,
  ListFilter,
  Share2,
  Play,
  Pause,
} from 'lucide-react-native';
import {
  Screen,
  Typography,
  Card,
  Button,
  Badge,
  EmptyState,
  Checkbox,
  Toast,
  SkeletonList,
  AnimatedListItem,
} from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import { usePreferenceStore } from '@store/usePreferenceStore';
import { issueRepository } from '@services/db/repositories';
import { duplicateIssue } from '@services/duplication/issueDuplication';
import { shareIssue } from '@services/share/shareExtension';
import * as Sharing from 'expo-sharing';
import { Audio } from 'expo-av';
import { spacing, radius } from '@theme/index';
import type { Issue, IssueStatus, Photo } from '@/types/domain';

function getStatusBadgeVariant(status: IssueStatus): 'default' | 'info' | 'success' {
  switch (status) {
    case 'in_progress':
      return 'info';
    case 'resolved':
      return 'success';
    case 'open':
    case 'closed':
    default:
      return 'default';
  }
}

function formatStatusLabel(status: IssueStatus): string {
  return status.replace('_', ' ');
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleDateString();
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDuration(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const PhotoThumbnail = React.memo(function PhotoThumbnail({
  photo,
  onPress,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  photo: Photo;
  onPress: () => void;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}): JSX.Element {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        if (selectionMode) {
          onToggleSelect();
        } else {
          onPress();
        }
      }}
      style={styles.thumbnailContainer}
    >
      <Image
        source={{ uri: photo.thumbnailPath }}
        style={[styles.thumbnail, { backgroundColor: colors.backgroundTertiary }]}
        resizeMode="cover"
      />
      {photo.caption ? (
        <Typography
          variant="captionSmall"
          color="secondary"
          numberOfLines={1}
          style={styles.thumbnailCaption}
        >
          {photo.caption}
        </Typography>
      ) : null}
      {selectionMode ? (
        <View style={styles.photoCheckbox}>
          <Checkbox checked={selected} onPress={onToggleSelect} />
        </View>
      ) : null}
    </Pressable>
  );
});

const ReorderPhotoItem = React.memo(function ReorderPhotoItem({
  photo,
  index,
  dataLength,
  onMoveLeft,
  onMoveRight,
}: {
  photo: Photo;
  index: number;
  dataLength: number;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}): JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.sortablePhotoItem}>
      <Image
        source={{ uri: photo.thumbnailPath }}
        style={[styles.thumbnail, { backgroundColor: colors.backgroundTertiary }]}
        resizeMode="cover"
      />
      <View style={[styles.photoReorderControls, { backgroundColor: colors.scrim }]}>
        <Pressable
          onPress={onMoveLeft}
          disabled={index <= 0}
          style={[styles.arrowButton, index <= 0 && styles.arrowButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Move photo left"
        >
          <ChevronLeft size={18} color={index > 0 ? colors.textPrimary : colors.textTertiary} />
        </Pressable>
        <Pressable
          onPress={onMoveRight}
          disabled={index >= dataLength - 1}
          style={[styles.arrowButton, index >= dataLength - 1 && styles.arrowButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Move photo right"
        >
          <ChevronRight
            size={18}
            color={index < dataLength - 1 ? colors.textPrimary : colors.textTertiary}
          />
        </Pressable>
      </View>
    </View>
  );
});

export default function IssueDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { issues, deleteIssue } = useIssueStore();
  const {
    photos,
    loadPhotosByIssue,
    isLoading: photosLoading,
    bulkDelete: bulkDeletePhotos,
    updateSortOrder: updatePhotosSortOrder,
  } = usePhotoStore();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [durationMillis, setDurationMillis] = useState<number | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchIssue(): Promise<void> {
      const found = issues.find((i) => i.id === id);
      if (found) {
        if (mounted) {
          setIssue(found);
          setIsLoading(false);
        }
      } else {
        try {
          const data = await issueRepository.getById(id);
          if (mounted) {
            setIssue(data);
          }
        } catch {
          if (mounted) {
            setIssue(null);
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
      void loadPhotosByIssue(id);
    }
    void fetchIssue();
    return (): void => {
      mounted = false;
    };
  }, [id, issues, loadPhotosByIssue]);

  useEffect(() => {
    let currentSound: Audio.Sound | null = null;

    async function loadSound(): Promise<void> {
      if (!issue?.voiceNoteUrl) return;
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: issue.voiceNoteUrl },
        { shouldPlay: false },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            setDurationMillis(status.durationMillis ?? null);
            setPlaybackPosition(status.positionMillis);
          }
        }
      );
      currentSound = newSound;
      setSound(newSound);
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDurationMillis(status.durationMillis ?? null);
      }
    }

    void loadSound();

    return (): void => {
      void currentSound?.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setDurationMillis(null);
      setPlaybackPosition(null);
    };
  }, [issue?.voiceNoteUrl]);

  const handleBack = useCallback((): void => {
    router.back();
  }, []);

  const handleEdit = useCallback((): void => {
    router.push(`/issues/edit/${id}`);
  }, [id]);

  const handleAddPhoto = useCallback((): void => {
    if (!issue) return;
    router.push(`/camera?projectId=${issue.projectId}&issueId=${issue.id}`);
  }, [issue]);

  const handleDelete = useCallback((): void => {
    Alert.alert(
      'Delete Issue',
      'Are you sure you want to delete this issue? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: (): void => {
            void (async (): Promise<void> => {
              try {
                await deleteIssue(id);
                router.back();
              } catch {
                // error is handled in store
              }
            })();
          },
        },
      ]
    );
  }, [id, deleteIssue]);

  const handlePhotoPress = useCallback(
    (photoId: string): void => {
      router.push(`/photos/${photoId}?issueId=${id}`);
    },
    [id]
  );

  const handleToggleSelect = useCallback((photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  }, [photos, selectedIds.size]);

  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    Alert.alert('Delete Photos', `Are you sure you want to delete ${ids.length} photo(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: (): void => {
          void bulkDeletePhotos(ids);
          setSelectedIds(new Set());
          setSelectionMode(false);
        },
      },
    ]);
  }, [selectedIds, bulkDeletePhotos]);

  const handleShare = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const target = photos.find((p) => p.id === ids[0]);
    if (target?.originalPath) {
      try {
        await Sharing.shareAsync(target.originalPath);
      } catch {
        // ignore
      }
    }
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [selectedIds, photos]);

  const reduceMotion = usePreferenceStore((s) => s.reduceMotion);

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!reduceMotion) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      const reordered = [...photos];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved!);
      const updates = reordered.map((p, idx) => ({ id: p.id, sortOrder: idx }));
      void updatePhotosSortOrder(updates).then(() => {
        setShowToast(true);
      });
    },
    [photos, updatePhotosSortOrder, reduceMotion]
  );

  const movePhotoLeft = useCallback(
    (photoId: string) => {
      const index = photos.findIndex((p) => p.id === photoId);
      if (index <= 0) return;
      handleReorder(index, index - 1);
    },
    [photos, handleReorder]
  );

  const movePhotoRight = useCallback(
    (photoId: string) => {
      const index = photos.findIndex((p) => p.id === photoId);
      if (index === -1 || index >= photos.length - 1) return;
      handleReorder(index, index + 1);
    },
    [photos, handleReorder]
  );

  const handleDuplicate = useCallback((): void => {
    void duplicateIssue(id).then((duplicated) => {
      setToastMessage('Issue duplicated');
      router.push(`/issues/${duplicated.id}`);
    });
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadPhotosByIssue(id).then(() => {
      setRefreshing(false);
    });
  }, [id, loadPhotosByIssue]);

  const togglePlayback = useCallback(async (): Promise<void> => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  }, [sound, isPlaying]);

  const headerRight = useMemo(() => {
    if (selectionMode) {
      return (
        <Pressable
          onPress={handleCancelSelection}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Cancel selection"
        >
          <X size={24} color={colors.textPrimary} />
        </Pressable>
      );
    }
    return (
      <View style={styles.headerRight}>
        <Pressable
          onPress={() => setReorderMode((v) => !v)}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel={reorderMode ? 'Exit reorder mode' : 'Enter reorder mode'}
        >
          <GripVertical size={24} color={reorderMode ? colors.primary : colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={() => setSelectionMode(true)}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Select photos"
        >
          <ListFilter size={24} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={handleEdit}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Edit issue"
        >
          <Pencil size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
    );
  }, [
    colors.primary,
    colors.textPrimary,
    handleCancelSelection,
    handleEdit,
    reorderMode,
    selectionMode,
  ]);

  if (isLoading) {
    return (
      <Screen
        scrollable={false}
        header={{
          title: 'Issue Detail',
          leftIcon: ChevronLeft,
          onLeftPress: handleBack,
        }}
        pad
      >
        <View style={styles.centered}>
          <SkeletonList count={3} lines={2} />
        </View>
      </Screen>
    );
  }

  if (!issue) {
    return (
      <Screen
        scrollable={false}
        header={{
          title: 'Issue Detail',
          leftIcon: ChevronLeft,
          onLeftPress: handleBack,
        }}
        pad
      >
        <View style={styles.centered}>
          <Typography variant="body" color="secondary">
            Issue not found.
          </Typography>
          <Button title="Go Back" onPress={handleBack} style={styles.notFoundButton} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scrollable={false}
      header={{
        title: 'Issue Detail',
        leftIcon: ChevronLeft,
        onLeftPress: handleBack,
        rightElement: headerRight,
      }}
      pad
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.content}>
            <View style={styles.gallerySection}>
              {reorderMode ? (
                <View style={styles.reorderBanner}>
                  <Typography variant="caption" color="primary">
                    Drag to reorder photos
                  </Typography>
                </View>
              ) : null}
              {photos.length === 0 && !photosLoading ? (
                <View style={styles.emptyGallery}>
                  <EmptyState
                    icon={ImageIcon}
                    title="No photos yet"
                    actionTitle="Add Photo"
                    onAction={handleAddPhoto}
                    accessibilityLabel="No photos yet"
                  />
                </View>
              ) : reorderMode ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sortableGalleryList}
                  accessibilityLabel={`Photos list, ${photos.length} items, reorder mode`}
                >
                  {photos.map((photo, idx) => (
                    <ReorderPhotoItem
                      key={photo.id}
                      photo={photo}
                      index={idx}
                      dataLength={photos.length}
                      onMoveLeft={() => movePhotoLeft(photo.id)}
                      onMoveRight={() => movePhotoRight(photo.id)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <FlashList
                  data={photos}
                  horizontal
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <AnimatedListItem index={index} animate={!refreshing}>
                      <PhotoThumbnail
                        photo={item}
                        onPress={() => handlePhotoPress(item.id)}
                        selectionMode={selectionMode}
                        selected={selectedIds.has(item.id)}
                        onToggleSelect={() => handleToggleSelect(item.id)}
                      />
                    </AnimatedListItem>
                  )}
                  contentContainerStyle={styles.galleryList}
                  showsHorizontalScrollIndicator={false}
                  accessibilityLabel={`Photos list, ${photos.length} items`}
                  estimatedItemSize={100}
                />
              )}
            </View>

            <Card style={styles.metadataCard} accessibilityLabel="Issue details">
              <Typography
                variant="headingMd"
                accessibilityRole="header"
                color="primary"
                style={styles.title}
              >
                {issue.title}
              </Typography>

              <View style={styles.badgesRow}>
                <Badge title={capitalize(issue.severity)} variant={issue.severity} />
                <Badge
                  title={formatStatusLabel(issue.status)}
                  variant={getStatusBadgeVariant(issue.status)}
                />
              </View>

              <MetadataItem
                label="Category"
                value={issue.category ? capitalize(issue.category) : '—'}
              />
              <MetadataItem label="Location" value={issue.locationDescription ?? '—'} />
              {issue.gpsLatitude !== null && issue.gpsLongitude !== null ? (
                <MetadataItem
                  label="GPS"
                  value={`Lat: ${issue.gpsLatitude.toFixed(6)}, Lng: ${issue.gpsLongitude.toFixed(6)}`}
                />
              ) : null}
              <MetadataItem label="Description" value={issue.description ?? '—'} />
              <MetadataItem label="Assigned To" value={issue.assignedTo ?? '—'} />
              <MetadataItem label="Due Date" value={formatDate(issue.dueDate)} />
              <MetadataItem label="Created" value={formatDate(issue.createdAt)} />
              <MetadataItem label="Updated" value={formatDate(issue.updatedAt)} />

              {issue.voiceNoteUrl ? (
                <View style={styles.voiceNoteSection}>
                  <Typography variant="caption" color="secondary">
                    Voice Note
                  </Typography>
                  <Button
                    title={isPlaying ? 'Pause' : 'Play Voice Note'}
                    variant="secondary"
                    icon={isPlaying ? Pause : Play}
                    onPress={() => void togglePlayback()}
                    style={styles.voiceNoteButton}
                  />
                  {durationMillis !== null ? (
                    <Typography variant="captionSmall" color="secondary">
                      {formatDuration(playbackPosition ?? 0)} / {formatDuration(durationMillis)}
                    </Typography>
                  ) : null}
                </View>
              ) : null}
            </Card>
          </View>
        </ScrollView>

        {!selectionMode && !reorderMode && (
          <View style={styles.actions}>
            <Button title="Edit Issue" fullWidth onPress={handleEdit} />
            <Button
              title="Share Issue Link"
              variant="secondary"
              fullWidth
              icon={Share2}
              onPress={() => {
                void shareIssue(id);
              }}
              style={styles.actionButton}
            />
            <Button
              title="Add Photo"
              variant="secondary"
              fullWidth
              icon={Camera}
              onPress={handleAddPhoto}
              style={styles.actionButton}
            />
            <Button
              title="Duplicate Issue"
              variant="secondary"
              fullWidth
              onPress={handleDuplicate}
              style={styles.actionButton}
            />
            <Button
              title="Delete Issue"
              variant="destructive"
              fullWidth
              onPress={handleDelete}
              style={styles.actionButton}
            />
          </View>
        )}

        {selectionMode ? (
          <View
            style={[styles.bulkBar, { backgroundColor: colors.backgroundSecondary }]}
            accessibilityRole="toolbar"
            accessibilityLabel="Bulk actions"
          >
            <Pressable
              onPress={handleSelectAll}
              style={styles.bulkBarSection}
              accessibilityRole="button"
              accessibilityLabel={
                selectedIds.size === photos.length ? 'Deselect all' : 'Select all'
              }
            >
              <Check size={20} color={colors.primary} />
              <Typography variant="bodySmall" color="primary" style={styles.bulkBarText}>
                {selectedIds.size === photos.length ? 'Deselect All' : 'Select All'}
              </Typography>
            </Pressable>
            <Typography
              variant="bodySmall"
              color="primary"
              style={styles.bulkCount}
              accessibilityLabel={`${selectedIds.size} photos selected`}
            >
              {selectedIds.size} selected
            </Typography>
            <View style={styles.bulkActions}>
              <Pressable
                onPress={() => {
                  void handleShare();
                }}
                style={styles.bulkActionButton}
                accessibilityRole="button"
                accessibilityLabel="Share selected photos"
              >
                <Share2 size={20} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={handleBulkDelete}
                style={styles.bulkActionButton}
                accessibilityRole="button"
                accessibilityLabel="Delete selected photos"
              >
                <Trash2 size={20} color={colors.error} />
              </Pressable>
              <Pressable
                onPress={handleCancelSelection}
                style={styles.bulkActionButton}
                accessibilityRole="button"
                accessibilityLabel="Cancel selection"
              >
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      {showToast ? (
        <Toast
          message="Photo order saved"
          variant="success"
          onDismiss={() => setShowToast(false)}
        />
      ) : null}
      {toastMessage ? (
        <Toast message={toastMessage} variant="success" onDismiss={() => setToastMessage(null)} />
      ) : null}
    </Screen>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.metadataItem}>
      <Typography variant="caption" color="secondary">
        {label}
      </Typography>
      <Typography variant="body" color="primary">
        {value}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing['4'],
    paddingBottom: spacing['4'],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundButton: {
    marginTop: spacing['4'],
  },
  gallerySection: {
    minHeight: 160,
  },
  emptyGallery: {
    minHeight: 160,
  },
  galleryList: {
    gap: spacing['2'],
    paddingVertical: spacing['2'],
  },
  sortableGalleryList: {
    flexDirection: 'row',
    gap: spacing['2'],
    paddingVertical: spacing['2'],
  },
  thumbnailContainer: {
    width: 120,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailCaption: {
    marginTop: spacing['1'],
  },
  metadataCard: {
    gap: spacing['4'],
  },
  title: {
    marginBottom: spacing['1'],
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['2'],
  },
  metadataItem: {
    gap: spacing['1'],
  },
  voiceNoteSection: {
    gap: spacing['2'],
    marginTop: spacing['2'],
  },
  voiceNoteButton: {
    alignSelf: 'flex-start',
  },
  actions: {
    marginTop: spacing['4'],
    gap: spacing['3'],
  },
  actionButton: {
    marginTop: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCheckbox: {
    position: 'absolute',
    top: spacing['1'],
    left: spacing['1'],
  },
  sortablePhotoItem: {
    width: 120,
    marginRight: spacing['2'],
  },
  photoDragHandle: {
    position: 'absolute',
    top: spacing['1'],
    right: spacing['1'],
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoReorderControls: {
    position: 'absolute',
    top: spacing['1'],
    right: spacing['1'],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radius.md,
    paddingHorizontal: spacing['1'],
  },
  arrowButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButtonDisabled: {
    opacity: 0.4,
  },
  reorderBanner: {
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['3'],
    backgroundColor: 'rgba(74,158,255,0.15)',
    borderRadius: radius.md,
    marginBottom: spacing['2'],
    alignItems: 'center',
  },
  bulkBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['4'],
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  bulkBarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkBarText: {
    marginLeft: spacing['2'],
  },
  bulkCount: {
    flex: 1,
    textAlign: 'center',
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['4'],
  },
  bulkActionButton: {
    padding: spacing['2'],
  },
});
