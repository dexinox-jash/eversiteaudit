import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Folder, AlertCircle, Image as ImageIcon, Clock } from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import {
  Screen,
  ListItem,
  Divider,
  EmptyState,
  Typography,
  Badge,
  AnimatedListItem,
} from '@components/index';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import { spacing } from '@theme/index';

type ActivityType = 'all' | 'project' | 'issue' | 'photo';

type ActivityItem = {
  id: string;
  type: 'project' | 'issue' | 'photo';
  title: string;
  subtitle: string;
  timestamp: number;
  icon: typeof Folder;
  iconColor: string;
};

type ActivitySection = {
  title: string;
  data: ActivityItem[];
};

const FILTER_OPTIONS: { key: ActivityType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'project', label: 'Projects' },
  { key: 'issue', label: 'Issues' },
  { key: 'photo', label: 'Photos' },
];

function getSectionTitle(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function ActivityScreen(): JSX.Element {
  const { colors } = useTheme();
  const { projects, loadProjects } = useProjectStore();
  const { issues, loadIssues } = useIssueStore();
  const { photos, loadPhotos } = usePhotoStore();
  const [filter, setFilter] = useState<ActivityType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void loadProjects();
    void loadIssues();
    void loadPhotos();
  }, [loadProjects, loadIssues, loadPhotos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProjects(), loadIssues(), loadPhotos()]);
    setRefreshing(false);
  }, [loadProjects, loadIssues, loadPhotos]);

  const activityItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    for (const project of projects) {
      if (project.isDeleted) continue;
      items.push({
        id: `project-${project.id}`,
        type: 'project',
        title: project.name,
        subtitle: project.siteAddress ?? 'New project created',
        timestamp: project.createdAt,
        icon: Folder,
        iconColor: colors.primary,
      });
    }

    for (const issue of issues) {
      if (issue.isDeleted) continue;
      const project = projects.find((p) => p.id === issue.projectId);
      items.push({
        id: `issue-${issue.id}`,
        type: 'issue',
        title: issue.title,
        subtitle: `${issue.severity} · ${issue.status}${project ? ` · ${project.name}` : ''}`,
        timestamp: issue.createdAt,
        icon: AlertCircle,
        iconColor: colors.warning,
      });
    }

    for (const photo of photos) {
      if (photo.isDeleted) continue;
      items.push({
        id: `photo-${photo.id}`,
        type: 'photo',
        title: photo.caption ?? 'Photo captured',
        subtitle: `${photo.width ?? '?'}×${photo.height ?? '?'}`,
        timestamp: photo.createdAt,
        icon: ImageIcon,
        iconColor: colors.success,
      });
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [projects, issues, photos, colors]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return activityItems;
    return activityItems.filter((item) => item.type === filter);
  }, [activityItems, filter]);

  const sections = useMemo<ActivitySection[]>(() => {
    const map = new Map<string, ActivityItem[]>();
    for (const item of filteredItems) {
      const date = new Date(item.timestamp);
      const key = getSectionTitle(date);
      const existing = map.get(key) ?? [];
      existing.push(item);
      map.set(key, existing);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [filteredItems]);

  const handlePress = (item: ActivityItem): void => {
    switch (item.type) {
      case 'project':
        router.push(`/projects/${item.id.replace('project-', '')}`);
        break;
      case 'issue':
        router.push(`/issues/${item.id.replace('issue-', '')}`);
        break;
      case 'photo':
        router.push(`/photos/${item.id.replace('photo-', '')}`);
        break;
    }
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderSectionHeader = (title: string, itemCount: number): JSX.Element => (
    <View style={styles.sectionHeader}>
      <Typography variant="bodySmall" weight="semibold" color="secondary">
        {title}
      </Typography>
      <Badge title={`${itemCount}`} variant="default" size="small" />
    </View>
  );

  return (
    <Screen header={{ title: 'Activity' }} scrollable={false}>
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((option) => {
          const active = filter === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => setFilter(option.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.primary : colors.backgroundSecondary,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${option.label}`}
              accessibilityState={{ selected: active }}
            >
              <Typography
                variant="caption"
                weight="medium"
                color={active ? colors.primaryForeground : colors.textPrimary}
              >
                {option.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No activity yet"
          subtitle="Your recent projects, issues, and photos will appear here."
        />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(section) => section.title}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: section }) => (
            <View>
              {renderSectionHeader(section.title, section.data.length)}
              {section.data.map((item, index) => (
                <AnimatedListItem key={item.id} index={index} animate={!refreshing}>
                  <View>
                    <ListItem
                      title={item.title}
                      subtitle={item.subtitle}
                      icon={item.icon}
                      iconColor={item.iconColor}
                      rightElement={
                        <Typography variant="caption" color="secondary">
                          {formatTime(item.timestamp)}
                        </Typography>
                      }
                      onPress={() => {
                        handlePress(item);
                      }}
                      accessibilityLabel={`${item.type}: ${item.title}`}
                    />
                    {index < section.data.length - 1 ? <Divider /> : null}
                  </View>
                </AnimatedListItem>
              ))}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.sectionGap} />}
          contentContainerStyle={{ paddingBottom: spacing['4'] }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: spacing['2'],
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
  },
  filterChip: {
    paddingVertical: spacing['1'],
    paddingHorizontal: spacing['3'],
    borderRadius: 9999,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    marginTop: spacing['2'],
  },
  sectionGap: {
    height: spacing['4'],
  },
});
