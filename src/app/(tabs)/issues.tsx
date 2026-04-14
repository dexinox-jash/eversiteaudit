import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, Plus } from 'lucide-react-native';
import { Screen, Typography, Card, EmptyState, FAB, Badge } from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { useIssueStore } from '@store/useIssueStore';
import { spacing } from '@theme/index';
import type { Issue, IssueStatus } from '@/types/domain';

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

function IssueItem({ issue }: { issue: Issue }): JSX.Element {
  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Badge title={issue.severity} variant={issue.severity} size="small" />
        <Badge
          title={issue.status.replace('_', ' ')}
          variant={getStatusBadgeVariant(issue.status)}
          size="small"
        />
      </View>
      <Typography variant="h4" color="primary" numberOfLines={2} style={styles.title}>
        {issue.title}
      </Typography>
    </Card>
  );
}

export default function IssuesScreen(): JSX.Element {
  const { colors } = useTheme();
  const { issues, isLoading, error, loadIssues } = useIssueStore();

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  return (
    <Screen header={{ title: 'Issues' }} scrollable={false} pad>
      {issues.length === 0 && !isLoading ? (
        <EmptyState
          icon={AlertTriangle}
          title="No Issues Found"
          subtitle="You have no issues tracked yet."
          actionTitle="Add Issue"
          onAction={() => router.push('/issues/new')}
        />
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <IssueItem issue={item} />}
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
        accessibilityLabel="Add issue"
        onPress={() => router.push('/issues/new')}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['2'],
  },
  title: {
    marginTop: spacing['1'],
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
