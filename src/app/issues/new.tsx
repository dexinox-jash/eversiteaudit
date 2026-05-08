import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Screen, TextInput, Button, Typography, Toast } from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { spacing } from '@theme/index';
import type { IssueSeverity, IssueStatus } from '@/types/domain';
import { useIssueStore } from '@store/useIssueStore';
import { useProjectStore } from '@store/useProjectStore';
import { hapticSuccess } from '@services/os/haptics';
import { issueSchema } from '@validation/issueSchema';
import { ZodError } from 'zod';

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
  const { colors } = useTheme();
  const { projectId: initialProjectId } = useLocalSearchParams<{ projectId?: string }>();
  const { projects, loadProjects } = useProjectStore();
  const { createIssue, error: storeError, clearError } = useIssueStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IssueSeverity>('medium');
  const [status, setStatus] = useState<IssueStatus>('open');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(initialProjectId);
  const [titleError, setTitleError] = useState<string | undefined>(undefined);
  const [descriptionError, setDescriptionError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleBack = useCallback((): void => {
    clearError();
    router.back();
  }, [clearError]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!selectedProjectId) {
      setTitleError('Please select a project');
      setDescriptionError(undefined);
      return;
    }
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
      await createIssue({
        projectId: selectedProjectId,
        title: title.trim(),
        description: description.trim() || null,
        severity,
        status,
      });
      hapticSuccess();
      setToast({ message: 'Issue created successfully', variant: 'success' });
      router.back();
    } catch {
      setIsSubmitting(false);
    }
  }, [title, description, severity, status, selectedProjectId, createIssue]);

  return (
    <Screen
      header={{
        title: 'New Issue',
        leftIcon: ChevronLeft,
        onLeftPress: handleBack,
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
              <View>
                <Typography variant="caption" color="secondary" style={styles.fieldLabel}>
                  Project <Text style={{ color: colors.error }}>*</Text>
                </Typography>
                <View style={styles.projectRow}>
                  {projects.map((p) => (
                    <Button
                      key={p.id}
                      title={p.name}
                      size="small"
                      variant={selectedProjectId === p.id ? 'primary' : 'secondary'}
                      onPress={() => setSelectedProjectId(p.id)}
                      accessibilityLabel={`Select project ${p.name}`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: selectedProjectId === p.id }}
                    />
                  ))}
                </View>
              </View>

              <TextInput
                label={
                  <>
                    Title <Text style={{ color: colors.error }}>*</Text>
                  </>
                }
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
                error={descriptionError}
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
                      accessibilityLabel={`Set severity to ${capitalize(sev)}`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: severity === sev }}
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
                      accessibilityLabel={`Set status to ${formatStatusLabel(st)}`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: status === st }}
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
            accessibilityLabel="Create issue"
            accessibilityHint="Double-tap to create the new issue"
          />
        </View>
      </KeyboardAvoidingView>
      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      ) : null}
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
