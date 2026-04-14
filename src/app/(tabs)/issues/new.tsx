import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Screen, TextInput, Button, Typography } from '@components/index';
import { spacing } from '@theme/index';
import type { IssueSeverity, IssueStatus } from '@/types/domain';
import { useIssueStore } from '@store/useIssueStore';
import { useProjectStore } from '@store/useProjectStore';

const SEVERITIES: IssueSeverity[] = ['critical', 'high', 'medium', 'low'];
const STATUSES: IssueStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatStatusLabel(status: IssueStatus): string {
  if (status === 'in_progress') return 'In Progress';
  return capitalize(status);
}

export default function NewIssueScreen(): JSX.Element {
  const { projectId: initialProjectId } = useLocalSearchParams<{ projectId?: string }>();
  const { projects, loadProjects } = useProjectStore();
  const { createIssue, error: storeError, clearError } = useIssueStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IssueSeverity>('medium');
  const [status, setStatus] = useState<IssueStatus>('open');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(initialProjectId);
  const [titleError, setTitleError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleBack = useCallback((): void => {
    clearError();
    router.back();
  }, [clearError]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    if (!selectedProjectId) {
      setTitleError('Please select a project');
      return;
    }
    setTitleError(undefined);
    setIsSubmitting(true);

    try {
      await createIssue({
        projectId: selectedProjectId,
        title: title.trim(),
        description: description.trim() || null,
        severity,
        status,
      });
      router.back();
    } catch {
      setIsSubmitting(false);
    }
  }, [title, description, severity, status, selectedProjectId, createIssue]);

  return (
    <Screen
      header={{
        title: 'New Issue',
        leftIcon: ArrowLeft,
        onLeftPress: handleBack,
      }}
    >
      <View style={styles.container}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View>
              <Typography variant="caption" color="secondary" style={styles.fieldLabel}>
                Project
              </Typography>
              <View style={styles.projectRow}>
                {projects.map((p) => (
                  <Button
                    key={p.id}
                    title={p.name}
                    size="small"
                    variant={selectedProjectId === p.id ? 'primary' : 'secondary'}
                    onPress={() => setSelectedProjectId(p.id)}
                  />
                ))}
              </View>
            </View>

            <TextInput
              label="Title"
              placeholder="Enter issue title"
              value={title}
              onChangeText={setTitle}
              autoFocus
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
              editable={!isSubmitting}
            />

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
          </View>
        </ScrollView>

        {storeError ? (
          <Typography variant="bodySmall" color="error" style={styles.errorText}>
            {storeError}
          </Typography>
        ) : null}

        <Button
          title="Create Issue"
          fullWidth
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
          style={styles.submitButton}
        />
      </View>
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
  projectRow: {
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
});
