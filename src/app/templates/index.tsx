import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  Text,
  RefreshControl,
  AccessibilityInfo,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Trash2, Plus, X, Pencil } from 'lucide-react-native';
import {
  Screen,
  Typography,
  Card,
  Button,
  TextInput,
  Toast,
  SkeletonList,
  AnimatedListItem,
} from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { templateRepository } from '@services/db/repositories';
import {
  createCustomTemplate,
  editCustomTemplate,
  deleteCustomTemplate,
  parseTemplateContent,
} from '@services/template/templateService';
import { spacing, touchTargets } from '@theme/index';
import { hapticSuccess, hapticError } from '@services/os/haptics';
import { templateSchema } from '@validation/templateSchema';
import { ZodError } from 'zod';
import type { Template } from '@/types/domain';

function isBuiltIn(template: Template): boolean {
  return template.id.startsWith('tmpl-');
}

export default function TemplatesScreen(): JSX.Element {
  const { colors } = useTheme();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const createTriggerRef = useRef<View>(null);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await templateRepository.getByType('project_structure');
      setTemplates(data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setCategories('');
    setNameError('');
    setEditingTemplate(null);
  }, []);

  const handleOpenModal = useCallback(() => {
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  const handleOpenEditModal = useCallback((template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setDescription(template.description ?? '');
    const parsed = parseTemplateContent(template.content);
    setCategories(parsed.sections.join(', '));
    setNameError('');
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingTemplate(null);
    AccessibilityInfo.announceForAccessibility('Template dialog closed');
  }, []);

  const validateForm = useCallback((): boolean => {
    try {
      templateSchema.parse({ name: name.trim() });
      setNameError('');
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const nameIssue = err.errors.find((e) => e.path[0] === 'name');
        setNameError(nameIssue?.message ?? 'Template name is required');
      }
      return false;
    }
  }, [name]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTemplates();
    setRefreshing(false);
  }, [loadTemplates]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const categoryList = categories
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      if (editingTemplate) {
        await editCustomTemplate(
          editingTemplate.id,
          name.trim(),
          description.trim() || null,
          categoryList
        );
      } else {
        await createCustomTemplate(name.trim(), description.trim() || null, categoryList);
      }
      hapticSuccess();
      setToast({
        message: editingTemplate
          ? 'Template updated successfully'
          : 'Template created successfully',
        variant: 'success',
      });
      setShowModal(false);
      resetForm();
      await loadTemplates();
    } catch {
      hapticError();
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, name, description, categories, editingTemplate, loadTemplates, resetForm]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteCustomTemplate(id);
        hapticSuccess();
        setToast({ message: 'Template deleted successfully', variant: 'success' });
        await loadTemplates();
      } catch {
        hapticError();
      }
    },
    [loadTemplates]
  );

  return (
    <Screen
      header={{
        title: 'Templates',
        leftIcon: ChevronLeft,
        onLeftPress: () => router.back(),
      }}
      pad
    >
      <View style={styles.container}>
        <View ref={createTriggerRef} collapsable={false} accessible={false}>
          <Button
            title="Create Custom Template"
            icon={Plus}
            onPress={handleOpenModal}
            fullWidth
            style={styles.createButton}
            accessibilityLabel="Create custom template"
          />
        </View>

        <Card style={styles.listCard}>
          {isLoading ? (
            <SkeletonList count={4} lines={1} />
          ) : templates.length === 0 ? (
            <Typography variant="body" color="secondary">
              No templates found.
            </Typography>
          ) : (
            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => void onRefresh()}
                  tintColor={colors.primary}
                />
              }
            >
              <View style={styles.list}>
                {templates.map((template, index) => {
                  const builtIn = isBuiltIn(template);
                  return (
                    <AnimatedListItem key={template.id} index={index} animate={!refreshing}>
                      <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <View style={styles.rowLeft}>
                          <Typography variant="body" weight="semibold" color={colors.textPrimary}>
                            {template.name}
                          </Typography>
                          {template.description ? (
                            <Typography variant="caption" color={colors.textSecondary}>
                              {template.description}
                            </Typography>
                          ) : null}
                          {builtIn ? (
                            <Typography variant="captionSmall" color={colors.primary}>
                              Built-in
                            </Typography>
                          ) : null}
                        </View>
                        {!builtIn && (
                          <View style={styles.rowActions}>
                            <Pressable
                              onPress={() => handleOpenEditModal(template)}
                              style={styles.actionButton}
                              accessibilityRole="button"
                              accessibilityLabel={`Edit template ${template.name}`}
                            >
                              <Pencil size={20} color={colors.primary} />
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                Alert.alert(
                                  'Delete Template',
                                  `Are you sure you want to delete "${template.name}"?`,
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                      text: 'Delete',
                                      style: 'destructive',
                                      onPress: () => void handleDelete(template.id),
                                    },
                                  ]
                                );
                              }}
                              style={styles.actionButton}
                              accessibilityRole="button"
                              accessibilityLabel={`Delete template ${template.name}`}
                            >
                              <Trash2 size={20} color={colors.error} />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </AnimatedListItem>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </Card>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
        accessibilityLabel="Create template dialog"
        accessibilityViewIsModal={true}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.scrim }]}>
          <Card style={styles.modalCard} elevation="3">
            <View style={styles.modalHeader}>
              <Typography variant="headingSm" accessibilityRole="header" color="primary">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </Typography>
              <Pressable
                onPress={handleCloseModal}
                style={styles.modalClose}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <TextInput
              label={
                <>
                  Name <Text style={{ color: colors.error }}>*</Text>
                </>
              }
              placeholder="Template name"
              value={name}
              onChangeText={setName}
              error={nameError || undefined}
              style={styles.modalInput}
            />

            <TextInput
              label="Description"
              placeholder="Optional description"
              value={description}
              onChangeText={setDescription}
              style={styles.modalInput}
            />

            <TextInput
              label="Issue Categories"
              placeholder="e.g. Safety, Quality, Compliance"
              value={categories}
              onChangeText={setCategories}
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={handleCloseModal}
                style={styles.modalActionButton}
              />
              <Button
                title={editingTemplate ? 'Update' : 'Save'}
                onPress={() => void handleSave()}
                loading={isSaving}
                disabled={isSaving}
                style={styles.modalActionButton}
              />
            </View>
          </Card>
        </View>
      </Modal>
      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing['4'],
  },
  createButton: {
    marginBottom: spacing['2'],
  },
  listCard: {
    flex: 1,
    padding: spacing['4'],
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
  },
  rowLeft: {
    flex: 1,
    gap: spacing['1'],
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
  },
  actionButton: {
    padding: spacing['2'],
    minWidth: touchTargets.minimum,
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['4'],
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    padding: spacing['4'],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['4'],
  },
  modalClose: {
    padding: spacing['1'],
  },
  modalInput: {
    marginBottom: spacing['3'],
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing['3'],
    marginTop: spacing['2'],
  },
  modalActionButton: {
    minWidth: 100,
  },
});
