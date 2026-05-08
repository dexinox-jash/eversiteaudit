import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Text,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Screen, TextInput, Button, Typography, Toast, SkeletonCard } from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { useProjectStore } from '@store/useProjectStore';
import { templateRepository } from '@services/db/repositories';
import { createProjectFromTemplate } from '@services/template/templateService';
import type { Template } from '@/types/domain';
import { spacing, radius } from '@theme/index';
import { hapticSuccess } from '@services/os/haptics';
import { projectSchema } from '@validation/projectSchema';
import { ZodError } from 'zod';

export default function NewProjectScreen(): JSX.Element {
  const { colors } = useTheme();
  const { createProject, error: storeError, clearError } = useProjectStore();

  const [name, setName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    async function loadTemplates(): Promise<void> {
      try {
        const data = await templateRepository.getByType('project_structure');
        if (!cancelled) {
          setTemplates(data);
          const defaultTemplate = data.find((t) => t.isDefault === 1) ?? data[0] ?? null;
          if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate.id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setTemplateError(err instanceof Error ? err.message : 'Failed to load templates');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTemplates(false);
        }
      }
    }
    void loadTemplates();
    return (): void => {
      cancelled = true;
    };
  }, []);

  const handleBack = (): void => {
    clearError();
    setSubmitError(null);
    router.back();
  };

  const validate = (): boolean => {
    try {
      projectSchema.parse({
        name: name.trim(),
        siteAddress: siteAddress.trim(),
        clientName: clientName.trim(),
        description: description.trim(),
      });
      setNameError('');
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const nameIssue = err.errors.find((e) => e.path[0] === 'name');
        setNameError(nameIssue?.message ?? '');
      }
      return false;
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) return;
    setIsSubmitting(true);
    clearError();
    setSubmitError(null);

    const payload = {
      name: name.trim(),
      siteAddress: siteAddress.trim() || null,
      clientName: clientName.trim() || null,
      description: description.trim() || null,
    };

    try {
      projectSchema.parse(payload);
    } catch (err) {
      if (err instanceof ZodError) {
        const nameIssue = err.errors.find((e) => e.path[0] === 'name');
        setNameError(nameIssue?.message ?? '');
      }
      setIsSubmitting(false);
      return;
    }

    try {
      const blankTemplate = templates.find((t) => t.isDefault === 1);
      if (selectedTemplateId && selectedTemplateId !== blankTemplate?.id) {
        await createProjectFromTemplate(selectedTemplateId, payload);
      } else {
        await createProject(payload);
      }
      hapticSuccess();
      setToast({ message: 'Project created successfully', variant: 'success' });
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Failed to create project:', err);
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create project. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      header={{
        title: 'New Project',
        leftIcon: ChevronLeft,
        onLeftPress: handleBack,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.form}>
          <View style={styles.fields}>
            <TextInput
              label={
                <>
                  Project Name <Text style={{ color: colors.error }}>*</Text>
                </>
              }
              placeholder="Enter project name"
              value={name}
              onChangeText={setName}
              autoFocus
              error={nameError || undefined}
              editable={!isSubmitting}
            />

            <View>
              <Typography
                variant="bodySmall"
                weight="medium"
                color={colors.textSecondary}
                style={styles.templateLabel}
              >
                Choose Template
              </Typography>
              {isLoadingTemplates ? (
                <View style={{ paddingVertical: spacing['2'] }}>
                  <SkeletonCard lines={1} />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.templateChips}
                >
                  {templates.map((template) => {
                    const isSelected = selectedTemplateId === template.id;
                    return (
                      <Pressable
                        key={template.id}
                        onPress={() => setSelectedTemplateId(template.id)}
                        style={[
                          styles.templateChip,
                          {
                            backgroundColor: isSelected
                              ? colors.primary
                              : colors.backgroundSecondary,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        disabled={isSubmitting}
                        accessibilityRole="radio"
                        accessibilityLabel={`Select template ${template.name}`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Typography
                          variant="bodySmall"
                          weight="medium"
                          color={isSelected ? colors.background : colors.textPrimary}
                        >
                          {template.name}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
              {templateError ? (
                <Typography
                  variant="bodySmall"
                  color={colors.error}
                  style={styles.templateErrorText}
                >
                  {templateError}
                </Typography>
              ) : null}
            </View>

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
              style={styles.descriptionInput}
              editable={!isSubmitting}
            />
          </View>

          {(submitError ?? storeError) ? (
            <Typography variant="bodySmall" color={colors.error} style={styles.errorText}>
              {submitError ?? storeError}
            </Typography>
          ) : null}

          <Button
            title="Create Project"
            onPress={() => void handleSubmit()}
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
            accessibilityLabel="Create project"
            accessibilityHint="Double-tap to create the new project"
          />
        </View>

        {isSubmitting ? (
          <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
    gap: spacing['6'],
  },
  fields: {
    gap: spacing['4'],
  },
  templateLabel: {
    marginBottom: spacing['2'],
  },
  templateChips: {
    gap: spacing['2'],
    paddingVertical: spacing['1'],
  },
  templateChip: {
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['4'],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  templateErrorText: {
    marginTop: spacing['2'],
  },
  descriptionInput: {
    minHeight: 100,
  },
  errorText: {
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
