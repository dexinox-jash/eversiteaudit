import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Screen, TextInput, Button, Typography, Toast } from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { useProjectStore } from '@store/useProjectStore';
import { projectRepository } from '@services/db/repositories';
import { spacing } from '@theme/index';
import { hapticSuccess } from '@services/os/haptics';
import type { ProjectPriority } from '@/types/domain';

const PRIORITIES: { label: string; value: ProjectPriority }[] = [
  { label: 'Low', value: 0 },
  { label: 'Medium', value: 1 },
  { label: 'High', value: 2 },
  { label: 'Critical', value: 3 },
];

export default function EditProjectScreen(): JSX.Element {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateProject, clearError } = useProjectStore();

  const [name, setName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>(2);
  const [nameError, setNameError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    async function loadProject(): Promise<void> {
      try {
        const project = await projectRepository.getById(id);
        if (!cancelled && project) {
          setName(project.name);
          setSiteAddress(project.siteAddress ?? '');
          setClientName(project.clientName ?? '');
          setDescription(project.description ?? '');
          setPriority(project.priority);
        }
      } catch {
        if (!cancelled) {
          setToast({ message: 'Failed to load project', variant: 'error' });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void loadProject();
    return (): void => {
      cancelled = true;
    };
  }, [id]);

  const handleBack = (): void => {
    clearError();
    router.back();
  };

  const validate = (): boolean => {
    if (!name.trim()) {
      setNameError('Project name is required');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await updateProject(id, {
        name: name.trim(),
        siteAddress: siteAddress.trim() || null,
        clientName: clientName.trim() || null,
        description: description.trim() || null,
        priority,
      });
      hapticSuccess();
      setToast({ message: 'Project updated successfully', variant: 'success' });
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to update project',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Screen header={{ title: 'Edit Project' }}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={{
        title: 'Edit Project',
        leftIcon: ChevronLeft,
        onLeftPress: handleBack,
        leftAccessibilityLabel: 'Go back',
      }}
      scrollable={false}
      pad
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            label={
              <>
                Project Name <Text style={{ color: colors.error }}>*</Text>
              </>
            }
            placeholder="Enter project name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError('');
            }}
            error={nameError || undefined}
            editable={!isSubmitting}
            autoFocus
          />

          <TextInput
            label="Site Address"
            placeholder="Enter site address"
            value={siteAddress}
            onChangeText={setSiteAddress}
            editable={!isSubmitting}
          />

          <TextInput
            label="Client Name"
            placeholder="Enter client name"
            value={clientName}
            onChangeText={setClientName}
            editable={!isSubmitting}
          />

          <TextInput
            label="Description"
            placeholder="Enter description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isSubmitting}
          />

          <Typography variant="body" color="primary" style={styles.priorityLabel}>
            Priority
          </Typography>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <Button
                key={p.value}
                title={p.label}
                variant={priority === p.value ? 'primary' : 'secondary'}
                size="small"
                onPress={() => setPriority(p.value)}
                disabled={isSubmitting}
              />
            ))}
          </View>

          <Button
            title="Save Changes"
            onPress={() => void handleSubmit()}
            loading={isSubmitting}
            disabled={isSubmitting}
            fullWidth
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing['4'],
    paddingBottom: spacing['8'],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityLabel: {
    marginTop: spacing['2'],
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing['2'],
    flexWrap: 'wrap',
  },
  submitButton: {
    marginTop: spacing['4'],
  },
});
