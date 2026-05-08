import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Folder, Plus, Search, Settings } from 'lucide-react-native';
import {
  Screen,
  Typography,
  EmptyState,
  FAB,
  Badge,
  ScreenHeader,
  ListItem,
  Button,
  AnimatedListItem,
} from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { useProjectStore, type ProjectFilter } from '@store/useProjectStore';
import { spacing } from '@theme/index';
import type { Project } from '@/types/domain';

const FILTERS: { key: ProjectFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
];

const ProjectItem = React.memo(function ProjectItem({
  project,
}: {
  project: Project;
}): JSX.Element {
  const { colors } = useTheme();
  const isArchived = project.status === 'archived';

  return (
    <Pressable
      onPress={() => router.push(`/projects/${project.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Open project ${project.name}`}
      accessibilityHint="Double-tap to view project details"
    >
      <ListItem
        icon={Folder}
        iconColor={colors.primary}
        iconBackground={colors.primarySubtle}
        title={project.name}
        subtitle={project.siteAddress ?? undefined}
        rightElement={
          <Badge
            title={project.status}
            variant={
              project.status === 'active'
                ? 'success'
                : project.status === 'completed'
                  ? 'info'
                  : 'default'
            }
            size="small"
          />
        }
        disabled={isArchived}
      />
    </Pressable>
  );
});

export default function ProjectsScreen(): JSX.Element {
  const { colors } = useTheme();
  const { projects, isLoading, error, loadProjects, filter, setFilter } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    const statusFiltered =
      filter === 'all' ? projects : projects.filter((p) => p.status === filter);
    const query = searchQuery.trim().toLowerCase();
    if (!query) return statusFiltered;
    return statusFiltered.filter(
      (p) => p.name.toLowerCase().includes(query) || p.siteAddress?.toLowerCase().includes(query)
    );
  }, [projects, filter, searchQuery]);

  return (
    <Screen
      header={
        <ScreenHeader
          title="Projects"
          searchProps={{
            icon: Search,
            placeholder: 'Search projects...',
            value: searchQuery,
            onChangeText: setSearchQuery,
            accessibilityLabel: 'Search projects',
          }}
          filterChips={FILTERS.map((f) => ({
            label: f.label,
            active: filter === f.key,
            onPress: () => setFilter(f.key),
          }))}
          rightElement={
            <Button
              title=""
              icon={Settings}
              variant="ghost"
              size="icon"
              onPress={() => router.push('/settings')}
              accessibilityLabel="Open settings"
              accessibilityHint="Double-tap to open app settings"
            />
          }
        />
      }
      scrollable={false}
      pad
    >
      {projects.length === 0 && !isLoading ? (
        <EmptyState
          icon={Folder}
          title="No Projects Yet"
          subtitle="Create your first site audit project to get started."
          actionTitle="New Project"
          onAction={() => router.push('/projects/new')}
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No projects match your search"
          subtitle="Try adjusting your search terms or filters."
          actionTitle="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <FlashList
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index} animate={!refreshing}>
              <ProjectItem project={item} />
            </AnimatedListItem>
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={72}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.error + '20' }]}>
          <Typography variant="bodySmall" color={colors.error}>
            {error}
          </Typography>
        </View>
      ) : null}

      <FAB
        icon={Plus}
        accessibilityLabel="Create new project"
        accessibilityHint="Double-tap to create a new audit project"
        onPress={() => router.push('/projects/new')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 152,
  },
  separator: {
    height: spacing['3'],
  },
  errorBanner: {
    position: 'absolute',
    bottom: 88,
    left: spacing['4'],
    right: spacing['4'],
    padding: spacing['3'],
    borderRadius: 8,
  },
});
