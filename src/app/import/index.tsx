import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { FileJson, FileArchive, Upload, CheckCircle, AlertCircle } from 'lucide-react-native';
import { Screen, Typography, Card, Button, Toast } from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { spacing, radius } from '@theme/index';
import { importFromJSON, importFromZIP, parseImportPreview } from '@services/import/projectImport';
import type { ImportPreview } from '@services/import/projectImport';
import { useProjectStore } from '@store/useProjectStore';

type ImportState = 'idle' | 'preview' | 'importing' | 'success' | 'error';

export default function ImportScreen(): JSX.Element {
  const { colors } = useTheme();
  const { loadProjects } = useProjectStore();
  const [importState, setImportState] = useState<ImportState>('idle');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/zip'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset) return;

      setFileUri(asset.uri);
      setFileName(asset.name ?? 'Unknown file');
      setImportState('preview');
      setErrorMessage('');
      setToast(null);

      if (asset.uri.endsWith('.json')) {
        const content = await fetch(asset.uri).then((res) => res.text());
        const previewData = await parseImportPreview(content);
        setPreview(previewData);
      } else {
        // For ZIP, we can't easily preview without extracting
        setPreview({
          projectName: asset.name ?? 'Unknown project',
          issueCount: 0,
          photoCount: 0,
        });
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to read file');
      setImportState('error');
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!fileUri) return;
    setImportState('importing');

    try {
      if (fileUri.endsWith('.json')) {
        const content = await fetch(fileUri).then((res) => res.text());
        const result = await importFromJSON(content);
        await loadProjects();
        setToast({
          message: `Imported "${result.project.name}" with ${result.issuesCreated} issues and ${result.photosCreated} photos.`,
          variant: 'success',
        });
        setImportState('success');
      } else {
        const result = await importFromZIP(fileUri);
        await loadProjects();
        setToast({
          message: `Imported "${result.project.name}" with ${result.issuesCreated} issues and ${result.photosCreated} photos.`,
          variant: 'success',
        });
        setImportState('success');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Import failed');
      setImportState('error');
      setToast({
        message: err instanceof Error ? err.message : 'Import failed',
        variant: 'error',
      });
    }
  }, [fileUri, loadProjects]);

  const handleDone = useCallback(() => {
    router.back();
  }, []);

  const handleRetry = useCallback(() => {
    setImportState('idle');
    setFileUri(null);
    setPreview(null);
    setErrorMessage('');
    setToast(null);
  }, []);

  const isZIP = fileUri?.endsWith('.zip') ?? false;
  const FormatIcon = isZIP ? FileArchive : FileJson;

  return (
    <Screen
      header={{
        title: 'Import Project',
      }}
      scrollable={false}
      pad
    >
      <View style={styles.container}>
        <Card style={styles.card} padding="6">
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: colors.backgroundTertiary }]}>
              <Upload size={32} color={colors.primary} />
            </View>

            <Typography
              variant="headingSm"
              accessibilityRole="header"
              color="primary"
              align="center"
            >
              Import Project
            </Typography>

            {importState === 'idle' && (
              <View style={styles.stateContainer}>
                <Typography variant="body" color="secondary" align="center">
                  Select a JSON or ZIP file to import a project with all its issues and photos.
                </Typography>
                <Button
                  title="Select File"
                  icon={Upload}
                  onPress={() => void handlePickFile()}
                  fullWidth
                  accessibilityLabel="Select import file"
                />
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={handleDone}
                  fullWidth
                  accessibilityLabel="Cancel import"
                />
              </View>
            )}

            {importState === 'preview' && preview && (
              <View style={styles.stateContainer}>
                <View style={styles.previewRow}>
                  <FormatIcon size={24} color={colors.primary} />
                  <Typography variant="body" weight="semibold" color="primary">
                    {fileName}
                  </Typography>
                </View>

                <View style={[styles.previewCard, { backgroundColor: colors.backgroundTertiary }]}>
                  <Typography variant="body" weight="semibold" color="primary">
                    {preview.projectName}
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    {preview.issueCount} {preview.issueCount === 1 ? 'issue' : 'issues'} •{' '}
                    {preview.photoCount} {preview.photoCount === 1 ? 'photo' : 'photos'}
                  </Typography>
                </View>

                <Button
                  title="Import"
                  onPress={() => void handleImport()}
                  fullWidth
                  accessibilityLabel="Import project"
                />
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={handleDone}
                  fullWidth
                  accessibilityLabel="Cancel import"
                />
              </View>
            )}

            {importState === 'importing' && (
              <View style={styles.stateContainer}>
                <Typography variant="body" color="secondary" align="center">
                  Importing project...
                </Typography>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={handleDone}
                  fullWidth
                  accessibilityLabel="Cancel import"
                />
              </View>
            )}

            {importState === 'success' && (
              <View style={styles.stateContainer}>
                <CheckCircle size={64} color={colors.success} />
                <Typography
                  variant="headingMd"
                  accessibilityRole="header"
                  color="primary"
                  align="center"
                >
                  Import Complete
                </Typography>
                <Button title="Done" onPress={handleDone} fullWidth accessibilityLabel="Done" />
              </View>
            )}

            {importState === 'error' && (
              <View style={styles.stateContainer}>
                <AlertCircle size={64} color={colors.error} />
                <Typography
                  variant="headingMd"
                  accessibilityRole="header"
                  color="primary"
                  align="center"
                >
                  Import Failed
                </Typography>
                <Typography variant="body" color="secondary" align="center">
                  {errorMessage}
                </Typography>
                <Button
                  title="Try Again"
                  onPress={handleRetry}
                  fullWidth
                  accessibilityLabel="Try import again"
                />
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={handleDone}
                  fullWidth
                  accessibilityLabel="Cancel import"
                />
              </View>
            )}
          </View>
        </Card>
      </View>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: 0,
  },
  content: {
    alignItems: 'center',
    gap: spacing['4'],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing['4'],
    marginTop: spacing['2'],
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  previewCard: {
    width: '100%',
    padding: spacing['4'],
    borderRadius: radius.md,
    gap: spacing['1'],
  },
});
