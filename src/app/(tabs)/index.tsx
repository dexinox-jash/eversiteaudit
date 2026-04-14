import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Folder, Plus, Search } from 'lucide-react-native';
import { Screen, Typography, Card, EmptyState, FAB, Badge } from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { useProjectStore } from '@store/useProjectStore';
import { spacing } from '@theme/index';
import type { Project } from '@/types/domain';

function ProjectItem({ project }: { project: Project }): JSX.Element {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primarySubtle }]}>
          <Folder size={24} color={colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <Typography variant="h4" color="primary" numberOfLines={1}>
            {project.name}
          </Typography>
          {project.siteAddress ? (
            <Typography variant="caption" color="secondary" numberOfLines={1}>
              {project.siteAddress}
            </Typography>
          ) : null}
        </View>
        <Badge
          title={project.status}
          variant={project.status === 'active' ? 'success' : project.status === 'completed' ? 'info' : 'default'}
          size="small"
        />
      </View>
    </Card>
  );
}

export default function ProjectsScreen(): JSX.Element {
  const { colors } = useTheme();
  const { projects, isLoading, error, loadProjects } = useProjectStore();

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return (
    <Screen
      header={{
        title: 'Projects',
        rightIcon: Search,
        onRightPress: () => {
          // Search will be implemented in a future phase
        },
      }}
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
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProjectItem project={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
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
        onPress={() => router.push('/projects/new')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 100,
  },
  separator: {
    height: spacing['3'],
  },
  card: {
    marginHorizontal: 0,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing['3'],
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
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
