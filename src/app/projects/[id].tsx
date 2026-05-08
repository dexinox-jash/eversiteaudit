import React, { useEffect, useMemo, useState, useCallback, useRef, memo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Image,
  RefreshControl,
  findNodeHandle,
  UIManager,
  Platform,
  AccessibilityInfo,
  LayoutAnimation,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Pencil,
  AlertTriangle,
  Image as ImageIcon,
  Camera,
  FileText,
  Share2,
  Plus,
  CheckCircle2,
  Calendar,
  Search,
  ArrowUp,
  ArrowDown,
  GripVertical,
  X,
  Check,
  Trash2,
  ListFilter,
  Archive,
  ArchiveRestore,
  Clock,
} from 'lucide-react-native';
import {
  Screen,
  Typography,
  Card,
  Badge,
  EmptyState,
  TextInput,
  // Button removed - unused
  Checkbox,
  Toast,
  Divider,
  AnimatedListItem,
} from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import { usePreferenceStore } from '@store/usePreferenceStore';
// import { shareProject } from '@services/share/shareExtension';
import { duplicateProject } from '@services/duplication/projectDuplication';
import { spacing, radius, touchTargets } from '@theme/index';
import { hapticLight, hapticSuccess } from '@services/os/haptics';
import type { Issue, IssueStatus, Photo, Project } from '@/types/domain';

type TabKey = 'overview' | 'issues' | 'photos' | 'timeline';

const STATUSES: IssueStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

function getStatusBadgeVariant(status: Project['status']): 'success' | 'info' | 'default' {
  switch (status) {
    case 'active':
      return 'success';
    case 'completed':
      return 'info';
    case 'archived':
    default:
      return 'default';
  }
}

function getIssueStatusBadgeVariant(status: IssueStatus): 'default' | 'info' | 'success' {
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

function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 3:
      return 'Critical';
    case 2:
      return 'High';
    case 1:
      return 'Medium';
    case 0:
    default:
      return 'Low';
  }
}

function getPriorityColor(
  priority: number,
  colors: {
    severity: { critical: string; high: string; medium: string; low: string };
  }
): string {
  switch (priority) {
    case 3:
      return colors.severity.critical;
    case 2:
      return colors.severity.high;
    case 1:
      return colors.severity.medium;
    case 0:
    default:
      return colors.severity.low;
  }
}

function TabButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}): JSX.Element {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${label} tab`}
      style={[
        styles.tabButton,
        {
          borderBottomColor: isActive ? colors.primary : 'transparent',
          borderBottomWidth: 2,
        },
      ]}
    >
      <Typography
        variant="body"
        weight="semibold"
        color={isActive ? colors.textPrimary : colors.textSecondary}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}): JSX.Element {
  const { colors } = useTheme();
  return (
    <Card style={styles.statCard} padding="4">
      <Icon size={20} color={colors.primary} style={styles.statIcon} />
      <Typography variant="headingSm" accessibilityRole="header" color="primary">
        {value}
      </Typography>
      <Typography variant="caption" color="secondary">
        {label}
      </Typography>
    </Card>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
}): JSX.Element {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.actionButton, { backgroundColor: colors.backgroundTertiary }]}
    >
      <Icon size={24} color={colors.primary} />
      <Typography variant="caption" color="primary" style={styles.actionLabel}>
        {label}
      </Typography>
    </Pressable>
  );
}

const IssueRow = memo(function IssueRow({
  issue,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  issue: Issue;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}): JSX.Element {
  return (
    <Pressable
      onPress={() => {
        if (selectionMode) {
          onToggleSelect();
        } else {
          router.push(`/issues/${issue.id}`);
        }
      }}
      accessibilityRole="button"
      accessibilityLabel={`Issue ${issue.title}`}
    >
      <Card style={styles.card}>
        <View style={styles.issueRow}>
          {selectionMode ? (
            <View style={styles.checkboxWrapper}>
              <Checkbox checked={selected} onPress={onToggleSelect} />
            </View>
          ) : null}
          <View style={styles.issueLeft}>
            <Badge title={issue.severity} variant={issue.severity} size="small" />
            <Typography variant="body" color="primary" numberOfLines={1} style={styles.issueTitle}>
              {issue.title}
            </Typography>
            <Typography variant="caption" color="secondary">
              {new Date(issue.createdAt).toLocaleDateString()}
              {issue.assignedTo ? ` · ${issue.assignedTo}` : ''}
              {issue.dueDate ? ` · Due ${new Date(issue.dueDate).toLocaleDateString()}` : ''}
            </Typography>
          </View>
          <Badge
            title={issue.status.replace('_', ' ')}
            variant={getIssueStatusBadgeVariant(issue.status)}
            size="small"
          />
        </View>
      </Card>
    </Pressable>
  );
});

const ReorderIssueRow = memo(function ReorderIssueRow({
  issue,
  index,
  dataLength,
  onMoveUp,
  onMoveDown,
}: {
  issue: Issue;
  index: number;
  dataLength: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}): JSX.Element {
  const { colors } = useTheme();
  return (
    <Card style={styles.card}>
      <View style={styles.issueRow}>
        <View style={styles.issueLeft}>
          <Badge title={issue.severity} variant={issue.severity} size="small" />
          <Typography variant="body" color="primary" numberOfLines={1} style={styles.issueTitle}>
            {issue.title}
          </Typography>
        </View>
        <View style={styles.reorderControls}>
          <Pressable
            onPress={onMoveUp}
            disabled={index <= 0}
            style={[styles.arrowButton, index <= 0 && styles.arrowButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Move issue up"
          >
            <ArrowUp size={18} color={index > 0 ? colors.primary : colors.textTertiary} />
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={index >= dataLength - 1}
            style={[styles.arrowButton, index >= dataLength - 1 && styles.arrowButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Move issue down"
          >
            <ArrowDown
              size={18}
              color={index < dataLength - 1 ? colors.primary : colors.textTertiary}
            />
          </Pressable>
        </View>
      </View>
    </Card>
  );
});

const PhotoGridItem = memo(function PhotoGridItem({
  photo,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  photo: Photo;
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
          router.push(`/photos/${photo.id}`);
        }
      }}
      accessibilityRole="button"
      accessibilityLabel={`Photo ${photo.id}`}
      style={styles.photoGridItem}
    >
      <View style={[styles.gridItemInner, { backgroundColor: colors.backgroundTertiary }]}>
        {photo.thumbnailPath ? (
          <Image
            source={{ uri: photo.thumbnailPath }}
            style={styles.photoThumb}
            resizeMode="cover"
          />
        ) : (
          <ImageIcon size={24} color={colors.textTertiary} />
        )}
      </View>
      {selectionMode ? (
        <View style={styles.photoCheckbox}>
          <Checkbox checked={selected} onPress={onToggleSelect} />
        </View>
      ) : null}
    </Pressable>
  );
});

function ProgressBar({ progress }: { progress: number }): JSX.Element {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarTrack, { backgroundColor: colors.backgroundTertiary }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${clamped}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
      <Typography variant="caption" color="secondary" style={styles.progressText}>
        {Math.round(clamped)}%
      </Typography>
    </View>
  );
}

function SeverityCount({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}): JSX.Element {
  return (
    <View style={styles.severityCount}>
      <Typography variant="captionSmall" color="secondary">
        {label}
      </Typography>
      <Typography variant="headingSm" accessibilityRole="header" color={color}>
        {count}
      </Typography>
    </View>
  );
}

function BreakdownItem({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}): JSX.Element {
  return (
    <View style={styles.breakdownItem}>
      <View style={[styles.breakdownDot, { backgroundColor: color }]} />
      <Typography variant="body" color="primary" style={styles.breakdownLabel}>
        {label}
      </Typography>
      <Typography variant="body" weight="semibold" color={color}>
        {count}
      </Typography>
    </View>
  );
}

function StatusPickerModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (status: IssueStatus) => void;
}): JSX.Element {
  const { colors } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityLabel="Change status"
      accessibilityViewIsModal={true}
    >
      <Pressable
        style={[styles.modalOverlay, { backgroundColor: colors.scrim }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss status picker"
      >
        <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
          <Typography
            variant="headingSm"
            accessibilityRole="header"
            color="primary"
            style={styles.modalTitle}
          >
            Change Status
          </Typography>
          {STATUSES.map((status) => (
            <Pressable
              key={status}
              style={[styles.statusOption, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => {
                onSelect(status);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={status.replace('_', ' ')}
            >
              <Typography variant="body" color="primary">
                {status.replace('_', ' ')}
              </Typography>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

export default function ProjectDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { projects, updateProject } = useProjectStore();
  const {
    issues,
    isLoading: issuesLoading,
    loadIssuesByProject,
    bulkDelete: bulkDeleteIssues,
    bulkUpdateStatus,
    updateSortOrder: updateIssuesSortOrder,
  } = useIssueStore();
  const { photos, isLoading: photosLoading, loadPhotosByProject } = usePhotoStore();
  const preferenceStore = usePreferenceStore();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [reorderMode, setReorderMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const statusTriggerRef = useRef<View>(null);

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);

  useEffect(() => {
    if (id) {
      void loadIssuesByProject(id);
      void loadPhotosByProject(id);
    }
  }, [id, loadIssuesByProject, loadPhotosByProject]);

  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    issues.forEach((issue) => {
      if (issue.severity in counts) {
        counts[issue.severity]++;
      }
    });
    return counts;
  }, [issues]);

  const resolvedCount = useMemo(
    () => issues.filter((i) => i.status === 'resolved').length,
    [issues]
  );

  const completionPercentage = useMemo(
    () => (issues.length > 0 ? (resolvedCount / issues.length) * 100 : 0),
    [resolvedCount, issues.length]
  );

  const daysActive = useMemo(() => {
    if (!project) return 0;
    return Math.max(1, Math.floor((Date.now() - project.createdAt) / (1000 * 60 * 60 * 24)));
  }, [project]);

  type TimelineItem = {
    id: string;
    type: 'issue' | 'photo';
    title: string;
    subtitle?: string;
    time: string;
    color: string;
    issueId?: string;
    photoId?: string;
  };

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    for (const issue of issues) {
      items.push({
        id: `timeline-issue-${issue.id}`,
        type: 'issue',
        title: issue.title,
        subtitle: `${issue.severity} · ${issue.status}`,
        time: new Date(issue.createdAt).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }),
        color: colors.severity[issue.severity] ?? colors.textSecondary,
        issueId: issue.id,
      });
    }
    for (const photo of photos) {
      items.push({
        id: `timeline-photo-${photo.id}`,
        type: 'photo',
        title: photo.caption ?? 'Photo captured',
        subtitle: `${photo.width ?? '?'}×${photo.height ?? '?'}`,
        time: new Date(photo.createdAt).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }),
        color: colors.success,
        photoId: photo.id,
      });
    }
    return items.sort((a, b) => {
      const aTime = a.issueId
        ? (issues.find((i) => i.id === a.issueId)?.createdAt ?? 0)
        : (photos.find((p) => p.id === a.photoId)?.createdAt ?? 0);
      const bTime = b.issueId
        ? (issues.find((i) => i.id === b.issueId)?.createdAt ?? 0)
        : (photos.find((p) => p.id === b.photoId)?.createdAt ?? 0);
      return bTime - aTime;
    });
  }, [issues, photos, colors]);

  const filteredIssues = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return issues;
    return issues.filter(
      (i) => i.title.toLowerCase().includes(query) || i.description?.toLowerCase().includes(query)
    );
  }, [issues, searchQuery]);

  const handleToggleSelect = useCallback((issueId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredIssues.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIssues.map((i) => i.id)));
    }
  }, [filteredIssues, selectedIds.size]);

  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    Alert.alert('Delete Issues', `Are you sure you want to delete ${ids.length} issue(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: (): void => {
          void bulkDeleteIssues(ids);
          setSelectedIds(new Set());
          setSelectionMode(false);
        },
      },
    ]);
  }, [selectedIds, bulkDeleteIssues]);

  const handleBulkStatusChange = useCallback(
    (status: IssueStatus) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      void bulkUpdateStatus(ids, status);
      setSelectedIds(new Set());
      setSelectionMode(false);
    },
    [selectedIds, bulkUpdateStatus]
  );

  const handleCloseStatusPicker = useCallback(() => {
    setShowStatusPicker(false);
    if (statusTriggerRef.current) {
      const node = findNodeHandle(statusTriggerRef.current);
      if (node && Platform.OS === 'android') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        (UIManager as any).sendAccessibilityEvent?.(node, 'focus');
      }
    }
    AccessibilityInfo.announceForAccessibility('Status picker closed');
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (id) {
      await Promise.all([loadIssuesByProject(id), loadPhotosByProject(id)]);
    }
    setRefreshing(false);
  }, [id, loadIssuesByProject, loadPhotosByProject]);

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!preferenceStore.reduceMotion) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      const reordered = [...issues];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved!);
      const updates = reordered.map((issue, idx) => ({ id: issue.id, sortOrder: idx }));
      void updateIssuesSortOrder(updates).then(() => {
        hapticLight();
        setShowToast(true);
      });
    },
    [issues, updateIssuesSortOrder, preferenceStore.reduceMotion]
  );

  const moveIssueUp = useCallback(
    (issueId: string) => {
      const index = issues.findIndex((i) => i.id === issueId);
      if (index <= 0) return;
      handleReorder(index, index - 1);
    },
    [issues, handleReorder]
  );

  const moveIssueDown = useCallback(
    (issueId: string) => {
      const index = issues.findIndex((i) => i.id === issueId);
      if (index === -1 || index >= issues.length - 1) return;
      handleReorder(index, index + 1);
    },
    [issues, handleReorder]
  );

  const handleDuplicate = useCallback(() => {
    if (!project) return;
    void duplicateProject(project.id).then((duplicated) => {
      hapticSuccess();
      setToastMessage('Project duplicated');
      router.push(`/projects/${duplicated.id}`);
    });
  }, [project]);

  const renderIssueItem = useCallback(
    ({ item, index }: { item: Issue; index: number }) => (
      <AnimatedListItem index={index} animate={!refreshing}>
        <IssueRow
          issue={item}
          selectionMode={selectionMode}
          selected={selectedIds.has(item.id)}
          onToggleSelect={() => handleToggleSelect(item.id)}
        />
      </AnimatedListItem>
    ),
    [selectionMode, selectedIds, handleToggleSelect, refreshing]
  );

  const renderPhotoItem = useCallback(
    ({ item, index }: { item: Photo; index: number }) => (
      <AnimatedListItem index={index} animate={!refreshing}>
        <PhotoGridItem
          photo={item}
          selectionMode={selectionMode}
          selected={selectedIds.has(item.id)}
          onToggleSelect={() => handleToggleSelect(item.id)}
        />
      </AnimatedListItem>
    ),
    [selectionMode, selectedIds, handleToggleSelect, refreshing]
  );

  const issuesTabHeaderRight = useMemo(() => {
    if (activeTab !== 'issues') return null;
    return (
      <View style={styles.headerRight}>
        {selectionMode ? (
          <Pressable
            onPress={handleCancelSelection}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel selection"
          >
            <X size={24} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <>
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
              accessibilityLabel="Select issues"
            >
              <ListFilter size={24} color={colors.textPrimary} />
            </Pressable>
          </>
        )}
      </View>
    );
  }, [
    activeTab,
    colors.primary,
    colors.textPrimary,
    reorderMode,
    selectionMode,
    handleCancelSelection,
  ]);

  if (!project) {
    return (
      <Screen header={{ title: 'Project' }} pad>
        <EmptyState
          icon={AlertTriangle}
          title="Project Not Found"
          subtitle="The project you are looking for does not exist."
          actionTitle="Go Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={{
        title: project.name,
        leftIcon: ChevronLeft,
        onLeftPress: () => router.back(),
        rightIcon: Pencil,
        onRightPress: () => {
          router.push(`/projects/edit/${id}`);
        },
        rightElement: issuesTabHeaderRight,
      }}
      scrollable={false}
      pad
    >
      <View style={{ flex: 1 }}>
        {/* Static Header */}

        {/* Project Info */}
        <Card
          style={styles.infoCard}
          accessibilityRole="none"
          accessibilityLabel="Project information"
        >
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Typography variant="caption" color="secondary">
                Site Address
              </Typography>
              <Typography variant="body" color="primary">
                {project.siteAddress ?? '—'}
              </Typography>
            </View>
            <View style={styles.infoBlock}>
              <Typography variant="caption" color="secondary">
                Client
              </Typography>
              <Typography variant="body" color="primary">
                {project.clientName ?? '—'}
              </Typography>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Badge
              title={project.status}
              variant={getStatusBadgeVariant(project.status)}
              size="small"
            />
            <View style={styles.priorityRow}>
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: getPriorityColor(project.priority, colors) },
                ]}
                accessibilityRole="image"
                accessibilityLabel={`${getPriorityLabel(project.priority)} priority`}
              />
              <Typography variant="caption" color="secondary">
                {getPriorityLabel(project.priority)} priority
              </Typography>
            </View>
          </View>

          <View style={styles.progressSection}>
            <Typography variant="caption" color="secondary">
              Completion
            </Typography>
            <ProgressBar progress={completionPercentage} />
          </View>

          <View
            style={[styles.severitySummary, { borderTopColor: colors.borderSubtle }]}
            accessibilityRole="summary"
            accessibilityLabel={`Severity breakdown: ${severityCounts.critical} critical, ${severityCounts.high} high, ${severityCounts.medium} medium, ${severityCounts.low} low`}
          >
            <SeverityCount
              label="Critical"
              count={severityCounts.critical}
              color={colors.severity.critical}
            />
            <SeverityCount label="High" count={severityCounts.high} color={colors.severity.high} />
            <SeverityCount
              label="Medium"
              count={severityCounts.medium}
              color={colors.severity.medium}
            />
            <SeverityCount label="Low" count={severityCounts.low} color={colors.severity.low} />
          </View>
        </Card>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TabButton
            label="Overview"
            isActive={activeTab === 'overview'}
            onPress={() => {
              setActiveTab('overview');
              setReorderMode(false);
              setSelectionMode(false);
            }}
          />
          <TabButton
            label="Issues"
            isActive={activeTab === 'issues'}
            onPress={() => {
              setActiveTab('issues');
              setReorderMode(false);
              setSelectionMode(false);
            }}
          />
          <TabButton
            label="Photos"
            isActive={activeTab === 'photos'}
            onPress={() => {
              setActiveTab('photos');
              setReorderMode(false);
              setSelectionMode(false);
            }}
          />
          <TabButton
            label="Timeline"
            isActive={activeTab === 'timeline'}
            onPress={() => {
              setActiveTab('timeline');
              setReorderMode(false);
              setSelectionMode(false);
            }}
          />
        </View>

        {/* Tab Content */}
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void onRefresh()}
                tintColor={colors.primary}
              />
            }
          >
            <View style={styles.tabContent}>
              <View style={styles.statsGrid}>
                <StatCard icon={AlertTriangle} label="Total Issues" value={issues.length} />
                <StatCard icon={ImageIcon} label="Total Photos" value={photos.length} />
                <StatCard
                  icon={CheckCircle2}
                  label="Completion"
                  value={`${Math.round(completionPercentage)}%`}
                />
                <StatCard icon={Calendar} label="Days Active" value={daysActive} />
              </View>

              <Typography
                variant="headingSm"
                accessibilityRole="header"
                color="primary"
                style={styles.sectionTitle}
              >
                Quick Actions
              </Typography>
              <View style={styles.actionsGrid}>
                <ActionButton
                  icon={Plus}
                  label="Add Issue"
                  onPress={() =>
                    router.push({ pathname: '/issues/new', params: { projectId: id } })
                  }
                />
                <ActionButton
                  icon={Camera}
                  label="Take Photo"
                  onPress={() => router.push({ pathname: '/camera', params: { projectId: id } })}
                />
                <ActionButton
                  icon={FileText}
                  label="Export Report"
                  onPress={() => {
                    const query = new URLSearchParams({
                      projectId: project.id,
                      format: 'pdf',
                      companyName: preferenceStore.companyName ?? '',
                      headerText: preferenceStore.reportHeaderText ?? '',
                      footerText: preferenceStore.reportFooterText ?? '',
                    });
                    router.push(`/export?${query.toString()}`);
                  }}
                />
                <ActionButton
                  icon={Share2}
                  label="Share Export"
                  onPress={() => {
                    const query = new URLSearchParams({
                      projectId: project.id,
                      format: 'pdf',
                      companyName: preferenceStore.companyName ?? '',
                      headerText: preferenceStore.reportHeaderText ?? '',
                      footerText: preferenceStore.reportFooterText ?? '',
                    });
                    router.push(`/export?${query.toString()}`);
                  }}
                />
                <ActionButton
                  icon={project.status === 'archived' ? ArchiveRestore : Archive}
                  label={project.status === 'archived' ? 'Unarchive Project' : 'Archive Project'}
                  onPress={() => {
                    const isArchiving = project.status !== 'archived';
                    Alert.alert(
                      isArchiving ? 'Archive Project' : 'Unarchive Project',
                      isArchiving
                        ? 'Are you sure you want to archive this project?'
                        : 'Are you sure you want to unarchive this project?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: isArchiving ? 'Archive' : 'Unarchive',
                          style: 'destructive',
                          onPress: () => {
                            const nextStatus =
                              project.status === 'archived' ? 'active' : 'archived';
                            void updateProject(project.id, { status: nextStatus }).then(() => {
                              hapticSuccess();
                              setToastMessage(
                                project.status === 'archived'
                                  ? 'Project unarchived'
                                  : 'Project archived'
                              );
                            });
                          },
                        },
                      ]
                    );
                  }}
                />
                <ActionButton icon={Share2} label="Duplicate Project" onPress={handleDuplicate} />
              </View>

              <Typography
                variant="headingSm"
                accessibilityRole="header"
                color="primary"
                style={styles.sectionTitle}
              >
                Severity Breakdown
              </Typography>
              <Card>
                <View style={styles.breakdownRow}>
                  <BreakdownItem
                    label="Critical"
                    count={severityCounts.critical}
                    color={colors.severity.critical}
                  />
                  <BreakdownItem
                    label="High"
                    count={severityCounts.high}
                    color={colors.severity.high}
                  />
                </View>
                <View style={styles.breakdownRow}>
                  <BreakdownItem
                    label="Medium"
                    count={severityCounts.medium}
                    color={colors.severity.medium}
                  />
                  <BreakdownItem
                    label="Low"
                    count={severityCounts.low}
                    color={colors.severity.low}
                  />
                </View>
              </Card>
            </View>
          </ScrollView>
        )}

        {activeTab === 'issues' && (
          <View style={styles.tabContent}>
            {reorderMode ? (
              <View style={styles.reorderBanner}>
                <Typography variant="caption" color="primary">
                  {searchQuery.trim() ? 'Disable search to reorder issues' : 'Drag to reorder'}
                </Typography>
              </View>
            ) : null}

            {!reorderMode && (
              <TextInput
                icon={Search}
                placeholder="Search issues..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search project issues"
                style={styles.searchInput}
                editable={!selectionMode}
              />
            )}

            {issues.length === 0 && !issuesLoading ? (
              <EmptyState
                icon={AlertTriangle}
                title="No Issues Yet"
                subtitle="There are no issues for this project."
                actionTitle="Add Issue"
                onAction={() => router.push('/issues/new')}
              />
            ) : filteredIssues.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No issues match your search"
                subtitle="Try adjusting your search terms."
                actionTitle="Clear Search"
                onAction={() => setSearchQuery('')}
              />
            ) : reorderMode ? (
              searchQuery.trim() ? null : (
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {issues.map((issue, idx) => (
                    <View key={issue.id} style={idx > 0 ? styles.sortableSeparator : null}>
                      <ReorderIssueRow
                        issue={issue}
                        index={idx}
                        dataLength={issues.length}
                        onMoveUp={() => moveIssueUp(issue.id)}
                        onMoveDown={() => moveIssueDown(issue.id)}
                      />
                    </View>
                  ))}
                </ScrollView>
              )
            ) : (
              <FlashList
                data={filteredIssues}
                keyExtractor={(item) => item.id}
                renderItem={renderIssueItem}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                estimatedItemSize={80}
                style={{ flex: 1 }}
              />
            )}
          </View>
        )}

        {activeTab === 'photos' && (
          <View style={styles.tabContent}>
            {photos.length === 0 && !photosLoading ? (
              <EmptyState
                icon={ImageIcon}
                title="No Photos Yet"
                subtitle="There are no photos for this project."
                actionTitle="Take Photo"
                onAction={() => router.push({ pathname: '/camera', params: { projectId: id } })}
                accessibilityLabel="No photos yet"
              />
            ) : (
              <FlashList
                data={photos}
                numColumns={3}
                keyExtractor={(item) => item.id}
                renderItem={renderPhotoItem}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                accessibilityLabel={`Photos grid, ${photos.length} items`}
                estimatedItemSize={120}
                style={{ flex: 1 }}
              />
            )}
          </View>
        )}

        {activeTab === 'timeline' && (
          <View style={styles.tabContent}>
            {timelineItems.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No Activity Yet"
                subtitle="Issues and photos will appear here in chronological order."
              />
            ) : (
              <FlashList
                data={timelineItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <AnimatedListItem index={index} animate={!refreshing}>
                    <Pressable
                      onPress={() => {
                        if (item.type === 'issue') router.push(`/issues/${item.issueId}`);
                        else if (item.type === 'photo') router.push(`/photos/${item.photoId}`);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.type}: ${item.title}`}
                    >
                      <Card style={styles.timelineCard}>
                        <View style={styles.timelineRow}>
                          <View style={[styles.timelineDot, { backgroundColor: item.color }]} />
                          <View style={styles.timelineContent}>
                            <View style={styles.timelineHeader}>
                              <Typography variant="caption" weight="semibold" color="secondary">
                                {item.time}
                              </Typography>
                              <Badge title={item.type} variant="default" size="small" />
                            </View>
                            <Typography variant="body" color="primary" numberOfLines={1}>
                              {item.title}
                            </Typography>
                            {item.subtitle ? (
                              <Typography variant="caption" color="secondary" numberOfLines={1}>
                                {item.subtitle}
                              </Typography>
                            ) : null}
                          </View>
                        </View>
                      </Card>
                    </Pressable>
                  </AnimatedListItem>
                )}
                ItemSeparatorComponent={() => <Divider />}
                scrollEnabled={true}
                contentContainerStyle={{ paddingBottom: spacing['4'] }}
                estimatedItemSize={72}
                style={{ flex: 1 }}
              />
            )}
          </View>
        )}
      </View>

      {selectionMode && activeTab === 'issues' ? (
        <View
          style={[
            styles.bulkBar,
            { backgroundColor: colors.backgroundSecondary, borderTopColor: colors.borderSubtle },
          ]}
          accessibilityRole="toolbar"
          accessibilityLabel="Bulk actions"
        >
          <Pressable
            onPress={handleSelectAll}
            style={styles.bulkBarSection}
            accessibilityRole="button"
            accessibilityLabel={
              selectedIds.size === filteredIssues.length ? 'Deselect all' : 'Select all'
            }
          >
            <Check size={20} color={colors.primary} />
            <Typography variant="bodySmall" color="primary" style={styles.bulkBarText}>
              {selectedIds.size === filteredIssues.length ? 'Deselect All' : 'Select All'}
            </Typography>
          </Pressable>
          <Typography
            variant="bodySmall"
            color="primary"
            style={styles.bulkCount}
            accessibilityLabel={`${selectedIds.size} issues selected`}
          >
            {selectedIds.size} selected
          </Typography>
          <View style={styles.bulkActions}>
            <Pressable
              ref={statusTriggerRef}
              onPress={() => setShowStatusPicker(true)}
              style={styles.bulkActionButton}
              accessibilityRole="button"
              accessibilityLabel="Change status"
            >
              <Typography variant="bodySmall" color={colors.primary}>
                Status
              </Typography>
            </Pressable>
            <Pressable
              onPress={handleBulkDelete}
              style={styles.bulkActionButton}
              accessibilityRole="button"
              accessibilityLabel="Delete selected issues"
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

      <StatusPickerModal
        visible={showStatusPicker}
        onClose={handleCloseStatusPicker}
        onSelect={handleBulkStatusChange}
      />

      {showToast ? (
        <Toast
          message="Issue order saved"
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

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing['6'],
  },
  infoCard: {
    marginHorizontal: 0,
    marginBottom: spacing['4'],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['3'],
  },
  infoBlock: {
    flex: 1,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing['2'],
  },
  progressSection: {
    marginTop: spacing['2'],
    marginBottom: spacing['3'],
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing['1'],
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressText: {
    marginLeft: spacing['3'],
    minWidth: 36,
    textAlign: 'right',
  },
  severitySummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing['3'],
  },
  severityCount: {
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: spacing['4'],
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing['3'],
  },
  tabContent: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['3'],
    marginBottom: spacing['5'],
  },
  statCard: {
    width: '47%',
    marginHorizontal: 0,
  },
  statIcon: {
    marginBottom: spacing['2'],
  },
  sectionTitle: {
    marginBottom: spacing['3'],
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['3'],
    marginBottom: spacing['5'],
  },
  actionButton: {
    width: '47%',
    height: touchTargets.minimum,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    marginLeft: spacing['2'],
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing['3'],
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing['2'],
  },
  breakdownLabel: {
    flex: 1,
  },
  card: {
    marginHorizontal: 0,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  issueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing['3'],
  },
  issueTitle: {
    marginLeft: spacing['3'],
  },
  separator: {
    height: spacing['3'],
  },
  sortableSeparator: {
    marginTop: spacing['3'],
  },
  photoGridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
  },
  gridItemInner: {
    flex: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
  },
  columnWrapper: {
    gap: 2,
  },
  searchInput: {
    marginBottom: spacing['3'],
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
  checkboxWrapper: {
    marginRight: spacing['3'],
  },
  dragHandle: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
  },
  arrowButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  arrowButtonDisabled: {
    opacity: 0.4,
  },
  reorderBanner: {
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['3'],
    backgroundColor: 'rgba(74,158,255,0.15)',
    borderRadius: radius.md,
    marginBottom: spacing['3'],
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    paddingHorizontal: spacing['4'],
    paddingTop: spacing['4'],
    paddingBottom: spacing['8'],
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  modalTitle: {
    marginBottom: spacing['4'],
  },
  statusOption: {
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
  },
  photoCheckbox: {
    position: 'absolute',
    top: spacing['2'],
    left: spacing['2'],
  },
  timelineCard: {
    marginBottom: spacing['2'],
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing['3'],
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: spacing['1'],
  },
  timelineContent: {
    flex: 1,
    gap: spacing['1'],
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
