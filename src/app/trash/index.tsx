import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Alert, Pressable, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, RotateCcw, Trash2 } from 'lucide-react-native';
import { Screen, Typography, Card, Toast, EmptyState, AnimatedListItem, SkeletonList } from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { spacing, touchTargets } from '@theme/index';
import { hapticSuccess, hapticError } from '@services/os/haptics';
import type { Project, Issue } from '@/types/domain';

type TrashTab = 'projects' | 'issues';

export default function TrashScreen(): JSX.Element {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TrashTab>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const { loadDeletedProjects, restoreProject, permanentlyDeleteProject } = useProjectStore();
  const { loadDeletedIssues, restoreIssue, permanentlyDeleteIssue } = useIssueStore();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadDeletedProjects();
      await loadDeletedIssues();
      const p = useProjectStore.getState().projects;
      const i = useIssueStore.getState().issues;
      setProjects(p);
      setIssues(i);
    } catch {
      setToast({ message: 'Failed to load trash', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [loadDeletedProjects, loadDeletedIssues]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRestore = useCallback(
    (item: Project | Issue, type: TrashTab) => {
      Alert.alert('Restore Item', `Restore "${'name' in item ? item.name : item.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: (): void => {
            void (async (): Promise<void> => {
              try {
                if (type === 'projects') {
                  await restoreProject(item.id);
                } else {
                  await restoreIssue(item.id);
                }
                setProjects((prev) => prev.filter((p) => p.id !== item.id));
                setIssues((prev) => prev.filter((i) => i.id !== item.id));
                hapticSuccess();
                setToast({ message: 'Item restored', variant: 'success' });
              } catch {
                hapticError();
                setToast({ message: 'Failed to restore item', variant: 'error' });
              }
            })();
          },
        },
      ]);
    },
    [restoreProject, restoreIssue]
  );

  const handlePermanentDelete = useCallback(
    (item: Project | Issue, type: TrashTab) => {
      Alert.alert(
        'Permanently Delete',
        `This will permanently delete "${'name' in item ? item.name : item.title}". This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: (): void => {
              void (async (): Promise<void> => {
                try {
                  if (type === 'projects') {
                    await permanentlyDeleteProject(item.id);
                  } else {
                    await permanentlyDeleteIssue(item.id);
                  }
                  setProjects((prev) => prev.filter((p) => p.id !== item.id));
                  setIssues((prev) => prev.filter((i) => i.id !== item.id));
                  hapticSuccess();
                  setToast({ message: 'Item permanently deleted', variant: 'success' });
                } catch {
                  hapticError();
                  setToast({ message: 'Failed to delete item', variant: 'error' });
                }
              })();
            },
          },
        ]
      );
    },
    [permanentlyDeleteProject, permanentlyDeleteIssue]
  );

  const renderItem = (item: Project | Issue, type: TrashTab, index: number): JSX.Element => {
    const title = 'name' in item ? item.name : item.title;
    const subtitle =
      type === 'projects'
        ? `${(item as Project).siteAddress ?? 'No address'} \u2022 ${(item as Project).clientName ?? 'No client'}`
        : `${(item as Issue).severity} \u2022 ${(item as Issue).status}`;
    const daysAgo = item.deletedAt
      ? Math.floor((Date.now() - item.deletedAt) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <AnimatedListItem index={index}>
        <Card style={styles.itemCard}>
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Typography variant="body" color="primary">
                {title}
              </Typography>
              <Typography variant="body" color="secondary">
                {subtitle}
              </Typography>
              <Typography variant="body" color="secondary">
                Deleted {daysAgo} day{daysAgo !== 1 ? 's' : ''} ago
              </Typography>
            </View>
            <View style={styles.itemActions}>
              <Pressable
                onPress={() => handleRestore(item, type)}
                accessibilityLabel={`Restore ${title}`}
                accessibilityRole="button"
                style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              >
                <RotateCcw size={20} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => handlePermanentDelete(item, type)}
                accessibilityLabel={`Permanently delete ${title}`}
                accessibilityRole="button"
                style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              >
                <Trash2 size={20} color={colors.error} />
              </Pressable>
            </View>
          </View>
        </Card>
      </AnimatedListItem>
    );
  };

  const items = activeTab === 'projects' ? projects : issues;

  return (
    <Screen
      header={{
        title: 'Trash',
        leftIcon: ChevronLeft,
        onLeftPress: () => router.back(),
        leftAccessibilityLabel: 'Go back',
      }}
    >
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(['projects', 'issues'] as TrashTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
            accessibilityLabel={`View deleted ${tab}`}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Typography variant="body" color={activeTab === tab ? 'primary' : 'secondary'}>
              {tab === 'projects' ? 'Projects' : 'Issues'}
            </Typography>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={colors.primary} />
        }
      >
        {isLoading && items.length === 0 ? (
          <SkeletonList count={5} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Trash2}
            title="Trash is Empty"
            subtitle={`No deleted ${activeTab} found.`}
          />
        ) : (
          items.map((item, index) => renderItem(item, activeTab, index))
        )}
      </ScrollView>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing['4'],
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing['4'],
    gap: spacing['2'],
  },
  itemCard: {
    padding: spacing['4'],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
    gap: spacing['1'],
  },
  itemActions: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  actionBtn: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  actionBtnPressed: {
    opacity: 0.7,
  },
});
