import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  Text,
  Linking,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import {
  GripVertical,
  X,
  Check,
  Trash2,
  ListFilter,
  Share2,
  Image as ImageIcon,
  Mic,
  MapPin,
  Square,
  ChevronLeft,
} from 'lucide-react-native';
import {
  Screen,
  TextInput,
  Button,
  Typography,
  Checkbox,
  Toast,
  SkeletonList,
} from '@components/index';
import { spacing, radius } from '@theme/index';
import { useTheme } from '@components/ThemeProvider';
import type { IssueSeverity, IssueStatus, IssueCategory, Photo } from '@/types/domain';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import { issueRepository } from '@services/db/repositories';
import { duplicateIssue } from '@services/duplication/issueDuplication';
import { hapticSuccess } from '@services/os/haptics';
import { issueSchema } from '@validation/issueSchema';
import { ZodError } from 'zod';
import * as Sharing from 'expo-sharing';
import * as Location from 'expo-location';
import {
  requestAudioPermissionsAsync,
  startRecording,
  stopRecording,
  deleteRecording,
} from '@services/media/voiceRecorder';
import {
  pickImagesFromLibrary,
  requestMediaLibraryPermissionsAsync,
} from '@services/media/imagePicker';
import type { Issue } from '@/types/domain';

const SEVERITIES: IssueSeverity[] = ['critical', 'high', 'medium', 'low'];
const STATUSES: IssueStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
const CATEGORIES: IssueCategory[] = ['safety', 'quality', 'compliance', 'environmental', 'other'];

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatStatusLabel(status: IssueStatus): string {
  if (status === 'in_progress') return 'In Progress';
  return capitalize(status);
}

function parseDueDate(input: string): number | null {
  if (!input.trim()) return null;
  const parsed = Date.parse(input.trim());
  if (!Number.isNaN(parsed)) return parsed;
  const num = Number(input.trim());
  if (!Number.isNaN(num)) return num;
  return null;
}

const PhotoGridItem = memo(function PhotoGridItem({
  photo,
  index,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  photo: Photo;
  index: number;
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
        }
      }}
      style={styles.photoGridItem}
      accessibilityLabel={`Photo ${index + 1}, tap to view`}
    >
      <Image
        source={{ uri: photo.thumbnailPath }}
        style={[styles.gridItemInner, { backgroundColor: colors.backgroundTertiary }]}
        resizeMode="cover"
      />
      {selectionMode ? (
        <View style={styles.photoCheckbox}>
          <Checkbox checked={selected} onPress={onToggleSelect} />
        </View>
      ) : null}
    </Pressable>
  );
});

const ReorderPhotoGridItem = memo(function ReorderPhotoGridItem({
  photo,
  index,
  dataLength,
  onOrderChange,
}: {
  photo: Photo;
  index: number;
  dataLength: number;
  onOrderChange: (newIndex: number) => void;
}): JSX.Element {
  const { colors } = useTheme();
  const [value, setValue] = useState(String(index + 1));

  useEffect(() => {
    setValue(String(index + 1));
  }, [index]);

  const handleBlur = useCallback(() => {
    const newPosition = parseInt(value, 10);
    if (Number.isNaN(newPosition)) {
      setValue(String(index + 1));
      return;
    }
    const clamped = Math.max(1, Math.min(dataLength, newPosition));
    if (clamped !== index + 1) {
      onOrderChange(clamped - 1);
    } else {
      setValue(String(clamped));
    }
  }, [value, index, dataLength, onOrderChange]);

  return (
    <View style={styles.photoGridItem}>
      <Image
        source={{ uri: photo.thumbnailPath }}
        style={[styles.gridItemInner, { backgroundColor: colors.backgroundTertiary }]}
        resizeMode="cover"
      />
      <View style={[styles.orderInputContainer, { backgroundColor: colors.scrim }]}>
        <RNTextInput
          style={[styles.orderInput, { color: colors.textPrimary }]}
          value={value}
          onChangeText={setValue}
          onBlur={handleBlur}
          keyboardType="number-pad"
          selectTextOnFocus
          accessibilityLabel={`Photo order, current position ${index + 1}`}
        />
      </View>
    </View>
  );
});

export default function EditIssueScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { issues, updateIssue, error: storeError, clearError } = useIssueStore();
  const {
    photos,
    loadPhotosByIssue,
    bulkDelete: bulkDeletePhotos,
    updateSortOrder: updatePhotosSortOrder,
    createPhoto,
  } = usePhotoStore();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory | null>(null);
  const [severity, setSeverity] = useState<IssueSeverity>('medium');
  const [status, setStatus] = useState<IssueStatus>('open');
  const [locationDescription, setLocationDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [gpsLatitude, setGpsLatitude] = useState<number | null>(null);
  const [gpsLongitude, setGpsLongitude] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [titleError, setTitleError] = useState<string | undefined>(undefined);
  const [descriptionError, setDescriptionError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const storeIssue = useMemo(() => issues.find((i) => i.id === id) ?? null, [issues, id]);

  useEffect(() => {
    let mounted = true;
    async function fetchIssue(): Promise<void> {
      let target = storeIssue;
      if (!target) {
        try {
          target = await issueRepository.getById(id);
        } catch {
          // handled below
        }
      }
      if (mounted) {
        if (target) {
          setIssue(target);
          setTitle(target.title);
          setDescription(target.description ?? '');
          setCategory(target.category);
          setSeverity(target.severity);
          setStatus(target.status);
          setLocationDescription(target.locationDescription ?? '');
          setAssignedTo(target.assignedTo ?? '');
          setDueDateInput(target.dueDate ? new Date(target.dueDate).toLocaleDateString() : '');
          setGpsLatitude(target.gpsLatitude ?? null);
          setGpsLongitude(target.gpsLongitude ?? null);
          setGpsAccuracy(target.gpsAccuracy ?? null);
          setVoiceNoteUrl(target.voiceNoteUrl ?? null);
        }
        setIsLoading(false);
      }
    }
    void fetchIssue();
    void loadPhotosByIssue(id);
    return (): void => {
      mounted = false;
    };
  }, [id, storeIssue, loadPhotosByIssue]);

  const handleBack = useCallback((): void => {
    clearError();
    router.back();
  }, [clearError]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    try {
      issueSchema.parse({
        title: title.trim(),
        description: description.trim(),
        severity,
        status,
      });
      setTitleError(undefined);
      setDescriptionError(undefined);
    } catch (err) {
      if (err instanceof ZodError) {
        const titleIssue = err.errors.find((e) => e.path[0] === 'title');
        const descIssue = err.errors.find((e) => e.path[0] === 'description');
        setTitleError(titleIssue?.message);
        setDescriptionError(descIssue?.message);
      }
      return;
    }
    setIsSubmitting(true);

    try {
      await updateIssue(id, {
        title: title.trim(),
        description: description.trim() || null,
        category,
        severity,
        status,
        locationDescription: locationDescription.trim() || null,
        assignedTo: assignedTo.trim() || null,
        dueDate: parseDueDate(dueDateInput),
        gpsLatitude,
        gpsLongitude,
        gpsAccuracy,
        voiceNoteUrl,
      });
      hapticSuccess();
      setToastMessage('Issue updated successfully');
      router.replace(`/issues/${id}`);
    } catch {
      setIsSubmitting(false);
    }
  }, [
    id,
    title,
    description,
    category,
    severity,
    status,
    locationDescription,
    assignedTo,
    dueDateInput,
    gpsLatitude,
    gpsLongitude,
    gpsAccuracy,
    voiceNoteUrl,
    updateIssue,
  ]);

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

  const handleCaptureLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if ((status as string) !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to capture GPS coordinates.'
      );
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    setGpsLatitude(location.coords.latitude);
    setGpsLongitude(location.coords.longitude);
    setGpsAccuracy(location.coords.accuracy ?? null);
  }, []);

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      const uri = await stopRecording();
      setIsRecording(false);
      if (uri) {
        if (voiceNoteUrl) {
          await deleteRecording(voiceNoteUrl);
        }
        setVoiceNoteUrl(uri);
      }
    } else {
      const granted = await requestAudioPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Denied', 'Audio recording permission is required.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ]);
        return;
      }
      await startRecording();
      setIsRecording(true);
    }
  }, [isRecording, voiceNoteUrl]);

  const handleImportPhotos = useCallback(async () => {
    const granted = await requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Denied', 'Media library permission is required to import photos.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ]);
      return;
    }
    const images = await pickImagesFromLibrary({ allowsMultipleSelection: true });
    if (images.length === 0 || !issue) return;
    for (const img of images) {
      await createPhoto({
        projectId: issue.projectId,
        issueId: id,
        originalPath: img.uri,
        thumbnailPath: img.uri,
        width: img.width,
        height: img.height,
        fileSizeBytes: img.fileSize,
      });
    }
  }, [issue, id, createPhoto]);

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const reordered = [...photos];
      const [moved] = reordered.splice(fromIndex, 1);
      if (!moved) return;
      reordered.splice(toIndex, 0, moved);
      const updates = reordered.map((p, idx) => ({ id: p.id, sortOrder: idx }));
      void updatePhotosSortOrder(updates).then(() => {
        setShowToast(true);
      });
    },
    [photos, updatePhotosSortOrder]
  );

  const handleOrderChange = useCallback(
    (photoId: string, newIndex: number) => {
      const currentIndex = photos.findIndex((p) => p.id === photoId);
      if (currentIndex === -1 || newIndex === currentIndex) return;
      handleReorder(currentIndex, newIndex);
    },
    [photos, handleReorder]
  );

  const handleDuplicate = useCallback((): void => {
    void duplicateIssue(id).then((duplicated) => {
      setToastMessage('Issue duplicated');
      router.push(`/issues/${duplicated.id}`);
    });
  }, [id]);

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
      </View>
    );
  }, [colors.primary, colors.textPrimary, handleCancelSelection, reorderMode, selectionMode]);

  if (isLoading) {
    return (
      <Screen
        header={{
          title: 'Edit Issue',
          leftIcon: ChevronLeft,
          onLeftPress: handleBack,
          rightElement: headerRight,
        }}
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
        header={{
          title: 'Edit Issue',
          leftIcon: ChevronLeft,
          onLeftPress: handleBack,
          rightElement: headerRight,
        }}
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
      header={{
        title: 'Edit Issue',
        leftIcon: ChevronLeft,
        onLeftPress: handleBack,
        rightElement: headerRight,
      }}
      scrollable={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.container}>
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.form}>
              <TextInput
                label={
                  <>
                    Title <Text style={{ color: colors.error }}>*</Text>
                  </>
                }
                placeholder="Enter issue title"
                value={title}
                onChangeText={setTitle}
                error={titleError}
                editable={!isSubmitting}
              />

              <TextInput
                label="Description"
                placeholder="Enter issue description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                error={descriptionError}
                editable={!isSubmitting}
              />

              <View style={styles.field}>
                <Typography variant="caption" color="secondary" style={styles.fieldLabel}>
                  Category
                </Typography>
                <View style={styles.buttonRow}>
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat}
                      title={capitalize(cat)}
                      size="small"
                      variant={category === cat ? 'primary' : 'secondary'}
                      onPress={() => setCategory(cat)}
                      disabled={isSubmitting}
                    />
                  ))}
                  <Button
                    title="None"
                    size="small"
                    variant={category === null ? 'primary' : 'secondary'}
                    onPress={() => setCategory(null)}
                    disabled={isSubmitting}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Typography variant="caption" color="secondary" style={styles.fieldLabel}>
                  Severity
                </Typography>
                <View style={styles.buttonRow}>
                  {SEVERITIES.map((sev) => (
                    <Button
                      key={sev}
                      title={capitalize(sev)}
                      size="small"
                      variant={severity === sev ? 'primary' : 'secondary'}
                      onPress={() => setSeverity(sev)}
                      disabled={isSubmitting}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Typography variant="caption" color="secondary" style={styles.fieldLabel}>
                  Status
                </Typography>
                <View style={styles.buttonRow}>
                  {STATUSES.map((st) => (
                    <Button
                      key={st}
                      title={formatStatusLabel(st)}
                      size="small"
                      variant={status === st ? 'primary' : 'secondary'}
                      onPress={() => setStatus(st)}
                      disabled={isSubmitting}
                    />
                  ))}
                </View>
              </View>

              <TextInput
                label="Location Description"
                placeholder="Enter location"
                value={locationDescription}
                onChangeText={setLocationDescription}
                editable={!isSubmitting}
              />

              <View style={styles.field}>
                <Typography variant="caption" color="secondary" style={styles.fieldLabel}>
                  GPS Location
                </Typography>
                <Button
                  title={
                    gpsLatitude != null && gpsLongitude != null
                      ? 'Update Location'
                      : 'Capture Location'
                  }
                  variant="secondary"
                  onPress={() => void handleCaptureLocation()}
                  disabled={isSubmitting}
                  icon={MapPin}
                />
                {gpsLatitude != null && gpsLongitude != null ? (
                  <Typography variant="bodySmall" color="secondary" style={styles.gpsText}>
                    Lat: {gpsLatitude.toFixed(6)}, Lng: {gpsLongitude.toFixed(6)}
                    {gpsAccuracy != null ? ` (±${gpsAccuracy.toFixed(1)}m)` : ''}
                  </Typography>
                ) : null}
              </View>

              <View style={styles.field}>
                <Typography variant="caption" color="secondary" style={styles.fieldLabel}>
                  Voice Note
                </Typography>
                <View style={styles.voiceRow}>
                  <Button
                    title={
                      isRecording
                        ? 'Stop Recording'
                        : voiceNoteUrl
                          ? 'Re-record Voice Note'
                          : 'Record Voice Note'
                    }
                    variant={isRecording ? 'primary' : 'secondary'}
                    onPress={() => void handleToggleRecording()}
                    disabled={isSubmitting}
                    icon={isRecording ? Square : Mic}
                  />
                </View>
                {isRecording ? (
                  <Typography variant="bodySmall" color="secondary" style={styles.recordingText}>
                    Recording...
                  </Typography>
                ) : voiceNoteUrl ? (
                  <Typography variant="bodySmall" color="secondary" style={styles.recordingText}>
                    Voice note saved
                  </Typography>
                ) : null}
              </View>

              <TextInput
                label="Assigned To"
                placeholder="Enter assignee"
                value={assignedTo}
                onChangeText={setAssignedTo}
                editable={!isSubmitting}
              />

              <TextInput
                label="Due Date"
                placeholder="MM/DD/YYYY or YYYY-MM-DD"
                value={dueDateInput}
                onChangeText={setDueDateInput}
                editable={!isSubmitting}
              />

              <View style={styles.photoSectionHeader}>
                <Typography
                  variant="headingSm"
                  accessibilityRole="header"
                  color="primary"
                  style={styles.sectionTitle}
                >
                  Photos
                </Typography>
                <Button
                  title="Import Photos from Gallery"
                  size="small"
                  variant="secondary"
                  onPress={() => void handleImportPhotos()}
                  disabled={isSubmitting || selectionMode || reorderMode}
                  icon={ImageIcon}
                />
              </View>

              {reorderMode ? (
                <View style={styles.reorderBanner}>
                  <Typography variant="caption" color="primary">
                    Drag to reorder photos
                  </Typography>
                </View>
              ) : null}

              {photos.length === 0 ? (
                <Typography variant="body" color="secondary">
                  No photos attached to this issue.
                </Typography>
              ) : reorderMode ? (
                <View
                  style={styles.photoGrid}
                  accessibilityLabel={`Photos grid, ${photos.length} items, reorder mode`}
                >
                  {photos.map((photo, idx) => (
                    <ReorderPhotoGridItem
                      key={photo.id}
                      photo={photo}
                      index={idx}
                      dataLength={photos.length}
                      onOrderChange={(newIndex) => handleOrderChange(photo.id, newIndex)}
                    />
                  ))}
                </View>
              ) : (
                <FlashList
                  data={photos}
                  numColumns={3}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <PhotoGridItem
                      photo={item}
                      index={index}
                      selectionMode={selectionMode}
                      selected={selectedIds.has(item.id)}
                      onToggleSelect={() => handleToggleSelect(item.id)}
                    />
                  )}
                  scrollEnabled={false}
                  accessibilityLabel={`Photos grid, ${photos.length} items`}
                  estimatedItemSize={120}
                />
              )}
            </View>
          </ScrollView>

          {!selectionMode && !reorderMode && (
            <>
              {storeError ? (
                <Typography variant="bodySmall" color="error" style={styles.errorText}>
                  {storeError}
                </Typography>
              ) : null}

              <Button
                title="Duplicate Issue"
                variant="secondary"
                fullWidth
                onPress={handleDuplicate}
                style={styles.submitButton}
              />
              <Button
                title="Save Changes"
                fullWidth
                onPress={() => void handleSubmit()}
                disabled={isSubmitting}
                style={styles.submitButton}
              />
            </>
          )}

          {selectionMode ? (
            <View
              style={[
                styles.bulkBar,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderTopColor: colors.borderSubtle,
                },
              ]}
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
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundButton: {
    marginTop: spacing['4'],
  },
  form: {
    gap: spacing['4'],
    paddingBottom: spacing['4'],
  },
  field: {
    gap: spacing['2'],
  },
  fieldLabel: {
    marginBottom: spacing['1'],
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['2'],
  },
  errorText: {
    textAlign: 'center',
    marginBottom: spacing['2'],
  },
  submitButton: {
    marginTop: spacing['4'],
  },
  sectionTitle: {
    marginTop: spacing['2'],
    marginBottom: spacing['1'],
  },
  photoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing['2'],
    marginBottom: spacing['1'],
  },
  gpsText: {
    marginTop: spacing['1'],
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  recordingText: {
    marginTop: spacing['1'],
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  photoGridItem: {
    flex: 1,
    minWidth: '31%',
    aspectRatio: 1,
    margin: 1,
  },
  gridItemInner: {
    flex: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnWrapper: {
    gap: 2,
  },
  photoCheckbox: {
    position: 'absolute',
    top: spacing['1'],
    left: spacing['1'],
  },
  orderInputContainer: {
    position: 'absolute',
    top: spacing['1'],
    right: spacing['1'],
    borderRadius: radius.md,
    paddingHorizontal: spacing['1'],
    minWidth: 36,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInput: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 28,
    padding: 0,
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
