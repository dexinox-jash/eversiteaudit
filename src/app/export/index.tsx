import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FileText, Package, FileCode, Table, CheckCircle, AlertCircle } from 'lucide-react-native';
import { Screen, Typography, Card, Button, Toast } from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { spacing, radius } from '@theme/index';
import { exportProjectToPDF } from '@services/export/pdfExport';
import { exportProjectToZIP } from '@services/export/zipExport';
import { exportProjectToJSON } from '@services/export/jsonExport';
import { exportProjectToCSV } from '@services/export/csvExport';
import { shareFile } from '@services/export/shareExport';
import { REPORT_TEMPLATES } from '@services/export/reportTemplates';
import { usePreferenceStore } from '@store/usePreferenceStore';
import type { ExportResult } from '@services/export/types';
import { hapticSuccess, hapticError } from '@services/os/haptics';
import * as FileSystem from 'expo-file-system';

type ExportFormat = 'pdf' | 'zip' | 'json' | 'csv';
type ExportState = 'preparing' | 'exporting' | 'success' | 'error' | 'cancelled';

const FORMAT_CONFIG: Record<ExportFormat, { label: string; icon: React.ElementType }> = {
  pdf: { label: 'PDF Report', icon: FileText },
  zip: { label: 'ZIP Archive', icon: Package },
  json: { label: 'JSON Data', icon: FileCode },
  csv: { label: 'CSV Spreadsheet', icon: Table },
};

const STATUS_MESSAGES = ['Gathering data...', 'Processing photos...', 'Generating file...'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileName(path: string): string {
  return path.split('/').pop() ?? path;
}

export default function ExportScreen(): JSX.Element {
  const { projectId, format, companyName, headerText, footerText } = useLocalSearchParams<{
    projectId: string;
    format: ExportFormat;
    companyName?: string;
    headerText?: string;
    footerText?: string;
  }>();
  const { colors } = useTheme();
  const preferences = usePreferenceStore();

  const [state, setState] = useState<ExportState>('preparing');
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [cancelToast, setCancelToast] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatConfig = FORMAT_CONFIG[format] ?? FORMAT_CONFIG.pdf;
  const FormatIcon = formatConfig.icon;

  const handleProgress = useCallback((percent: number) => {
    setProgress(percent);
    const nextIndex = Math.min(
      Math.floor((percent / 100) * STATUS_MESSAGES.length),
      STATUS_MESSAGES.length - 1
    );
    setStatusIndex(nextIndex);
  }, []);

  const runExport = useCallback(async () => {
    setState('exporting');
    setProgress(0);
    setStatusIndex(0);
    setErrorMessage('');
    setCancelToast(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let exportResult: ExportResult;
      switch (format) {
        case 'pdf':
          exportResult = await exportProjectToPDF(
            projectId,
            undefined,
            {
              companyName: companyName ?? null,
              headerText: headerText ?? null,
              footerText: footerText ?? null,
            },
            selectedTemplateId ?? undefined,
            handleProgress,
            controller.signal
          );
          break;
        case 'zip':
          exportResult = await exportProjectToZIP(
            projectId,
            undefined,
            handleProgress,
            controller.signal
          );
          break;
        case 'json':
          exportResult = await exportProjectToJSON(
            projectId,
            undefined,
            handleProgress,
            controller.signal
          );
          break;
        case 'csv':
          exportResult = await exportProjectToCSV(
            projectId,
            undefined,
            handleProgress,
            controller.signal
          );
          break;
        default:
          throw new Error('Unsupported export format');
      }

      if (controller.signal.aborted) {
        throw new Error('Export aborted');
      }

      setProgress(100);
      setResult(exportResult);
      hapticSuccess();
      setState('success');
    } catch (error) {
      if (
        controller.signal.aborted ||
        (error instanceof Error && error.message === 'Export aborted')
      ) {
        setState('cancelled');
        setCancelToast('Export cancelled');
        // Clean up partial result if it exists
        if (result?.filePath) {
          try {
            await FileSystem.deleteAsync(result.filePath, { idempotent: true });
          } catch {
            // ignore cleanup errors
          }
        }
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Export failed');
        hapticError();
        setState('error');
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [
    projectId,
    format,
    companyName,
    headerText,
    footerText,
    selectedTemplateId,
    handleProgress,
    result,
  ]);

  useEffect(() => {
    if (format !== 'pdf') {
      const timeout = setTimeout(() => {
        void runExport();
      }, 800);
      return (): void => clearTimeout(timeout);
    }

    // PDF: auto-select last used template if available
    if (preferences.lastPdfReportTemplate) {
      setSelectedTemplateId(preferences.lastPdfReportTemplate);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (format === 'pdf' && selectedTemplateId && state === 'preparing') {
      void runExport();
    }
  }, [format, selectedTemplateId, state, runExport]);

  const handleShare = useCallback(() => {
    if (result) {
      void shareFile(result);
    }
  }, [result]);

  const handleRetry = useCallback(() => {
    setErrorMessage('');
    setCancelToast(null);
    setResult(null);
    void runExport();
  }, [runExport]);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setCancelToast('Export cancelled');
  }, []);

  const handleSelectTemplate = useCallback(
    (id: string) => {
      setSelectedTemplateId(id);
      void preferences.setLastPdfReportTemplate(id);
    },
    [preferences]
  );

  const renderTemplatePicker = (): JSX.Element => (
    <View style={styles.stateContainer}>
      <Typography variant="headingSm" accessibilityRole="header" color="primary" align="center">
        Choose Report Template
      </Typography>
      <ScrollView style={styles.templateList} contentContainerStyle={styles.templateListContent}>
        {REPORT_TEMPLATES.map((tpl) => (
          <Pressable
            key={tpl.id}
            onPress={() => handleSelectTemplate(tpl.id)}
            style={[
              styles.templateCard,
              { backgroundColor: colors.backgroundTertiary, borderColor: colors.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Select template ${tpl.name}`}
          >
            <Typography variant="body" weight="semibold" color={colors.textPrimary}>
              {tpl.name}
            </Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              {tpl.description}
            </Typography>
          </Pressable>
        ))}
      </ScrollView>
      <Button
        title="Cancel"
        variant="secondary"
        onPress={() => router.back()}
        fullWidth
        accessibilityLabel="Cancel export"
      />
    </View>
  );

  return (
    <Screen
      header={{
        title: 'Export Project',
      }}
      scrollable={false}
      pad
    >
      <View style={styles.container}>
        <Card style={styles.card} padding="6">
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: colors.backgroundTertiary }]}>
              <FormatIcon size={32} color={colors.primary} />
            </View>

            <Typography
              variant="headingSm"
              accessibilityRole="header"
              color="primary"
              align="center"
            >
              {formatConfig.label}
            </Typography>

            {state === 'preparing' && format === 'pdf' && !selectedTemplateId ? (
              renderTemplatePicker()
            ) : state === 'preparing' ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Typography variant="body" color="secondary" align="center">
                  Preparing export...
                </Typography>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => router.back()}
                  fullWidth
                  accessibilityLabel="Cancel export"
                />
              </View>
            ) : null}

            {state === 'exporting' && (
              <View style={styles.stateContainer}>
                <View
                  style={[styles.progressTrack, { backgroundColor: colors.backgroundTertiary }]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, progress)}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Typography variant="body" color="secondary" align="center">
                  {STATUS_MESSAGES[statusIndex] ?? STATUS_MESSAGES[STATUS_MESSAGES.length - 1]}
                </Typography>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={handleCancel}
                  fullWidth
                  accessibilityLabel="Cancel export"
                />
              </View>
            )}

            {state === 'success' && result && (
              <View style={styles.stateContainer}>
                <CheckCircle size={64} color={colors.success} />
                <Typography
                  variant="headingMd"
                  accessibilityRole="header"
                  color="primary"
                  align="center"
                >
                  Export Complete
                </Typography>
                <Typography variant="body" color="secondary" align="center">
                  {getFileName(result.filePath)}
                </Typography>
                <Typography variant="caption" color="tertiary" align="center">
                  {formatFileSize(result.fileSize)}
                </Typography>
                <Button
                  title="Share File"
                  onPress={handleShare}
                  fullWidth
                  accessibilityLabel="Share exported file"
                />
                <Button
                  title="Done"
                  variant="secondary"
                  onPress={() => router.back()}
                  fullWidth
                  accessibilityLabel="Done"
                />
              </View>
            )}

            {state === 'error' && (
              <View style={styles.stateContainer}>
                <AlertCircle size={64} color={colors.error} />
                <Typography
                  variant="headingMd"
                  accessibilityRole="header"
                  color="primary"
                  align="center"
                >
                  Export Failed
                </Typography>
                <Typography variant="body" color="secondary" align="center">
                  {errorMessage}
                </Typography>
                <Button
                  title="Try Again"
                  onPress={handleRetry}
                  fullWidth
                  accessibilityLabel="Try export again"
                />
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => router.back()}
                  fullWidth
                  accessibilityLabel="Cancel export"
                />
              </View>
            )}

            {state === 'cancelled' && (
              <View style={styles.stateContainer}>
                <AlertCircle size={64} color={colors.warning} />
                <Typography
                  variant="headingMd"
                  accessibilityRole="header"
                  color="primary"
                  align="center"
                >
                  Export Cancelled
                </Typography>
                <Typography variant="body" color="secondary" align="center">
                  The export was cancelled before completion.
                </Typography>
                <Button
                  title="Try Again"
                  onPress={handleRetry}
                  fullWidth
                  accessibilityLabel="Try export again"
                />
                <Button
                  title="Done"
                  variant="secondary"
                  onPress={() => router.back()}
                  fullWidth
                  accessibilityLabel="Done"
                />
              </View>
            )}
          </View>
        </Card>
      </View>

      {cancelToast ? (
        <Toast message={cancelToast} variant="warning" onDismiss={() => setCancelToast(null)} />
      ) : null}
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
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  templateList: {
    width: '100%',
    maxHeight: 320,
  },
  templateListContent: {
    gap: spacing['2'],
  },
  templateCard: {
    width: '100%',
    padding: spacing['3'],
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing['1'],
  },
});
