import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Modal, Alert, AccessibilityInfo } from 'react-native';
import { router } from 'expo-router';
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  FileArchive,
  Moon,
  Sun,
  Smartphone,
  Accessibility,
  AlertTriangle,
  Database,
  Bell,
  Clock,
  Lock,
  History,
  Trash2,
  HardDrive,
  Timer,
  FileText,
  FileCheck,
  Import,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  Screen,
  Typography,
  Card,
  Button,
  TextInput,
  Toast,
  ScreenHeader,
  Section,
  ActionRow,
  Divider,
  PassphraseStrengthMeter,
} from '@components/index';
import {
  evaluatePassphraseStrength,
  MIN_PASSPHRASE_LENGTH,
} from '@services/security/passphraseStrength';
import { useTheme } from '@components/ThemeProvider';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import { usePreferenceStore } from '@store/usePreferenceStore';
import { recordBackupCreated } from '@services/backup/reminderService';
import {
  exportProjectToJSON,
  exportProjectToCSV,
  exportProjectToZIP,
  shareFile,
  getExportHistory,
  clearExportHistory,
} from '@services/export';
import { calculateCacheSize, runFullCleanup } from '@services/storage/cacheManager';
import { createBackup, restoreBackup } from '@services/backup';
import { spacing } from '@theme/index';
import type { ThemePreference } from '@services/storage/preferences';

type ExportFormat = 'json' | 'csv' | 'zip';

interface ExportOption {
  format: ExportFormat;
  title: string;
  icon: typeof FileJson;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { format: 'json', title: 'Export as JSON', icon: FileJson },
  { format: 'csv', title: 'Export as CSV', icon: FileSpreadsheet },
  { format: 'zip', title: 'Export as ZIP', icon: FileArchive },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function SettingsScreen(): JSX.Element {
  const { themeSetting, setTheme, reduceMotion, highContrast } = useTheme();
  const preferenceStore = usePreferenceStore();
  const { projects, loadProjects } = useProjectStore();
  const { loadIssues } = useIssueStore();
  const { photos, loadPhotos } = usePhotoStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id ?? '');
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [restorePath, setRestorePath] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const [exportPassword, setExportPassword] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [exportHistory, setExportHistory] = useState<Awaited<ReturnType<typeof getExportHistory>>>(
    []
  );
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [isClearingCache, setIsClearingCache] = useState(false);
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]!.id);
    }
  }, [projects, selectedProjectId]);

  React.useEffect(() => {
    void (async (): Promise<void> => {
      const history = await getExportHistory();
      setExportHistory(history);
      const size = await calculateCacheSize();
      setCacheSize(size);
    })();
  }, []);

  const showToast = useCallback(
    (message: string, variant: 'success' | 'error' = 'success'): void => {
      setToast({ message, variant });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  const handleExport = async (format: ExportFormat): Promise<void> => {
    if (!selectedProjectId) {
      showToast('Please select a project first.', 'error');
      return;
    }
    setIsExporting(format);
    try {
      let result;
      const password = exportPassword.trim() || undefined;
      switch (format) {
        case 'json':
          result = await exportProjectToJSON(selectedProjectId, password);
          break;
        case 'csv':
          result = await exportProjectToCSV(selectedProjectId, password);
          break;
        case 'zip':
          result = await exportProjectToZIP(selectedProjectId, password);
          break;
      }
      showToast(`Exported as ${format.toUpperCase()} successfully.`);
      setTimeout(() => {
        void (async (): Promise<void> => {
          try {
            await shareFile(result.filePath);
            showToast('Share sheet opened.');
          } catch (shareErr) {
            showToast(shareErr instanceof Error ? shareErr.message : 'Share failed.', 'error');
          }
        })();
      }, 500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Export failed.', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleRestore = async (): Promise<void> => {
    if (!restorePath || !restorePassphrase) {
      showToast('Please enter both backup path and passphrase.', 'error');
      return;
    }
    setIsRestoring(true);
    try {
      const result = await restoreBackup(restorePath, restorePassphrase);
      if (!result.success) {
        showToast(result.errors.join('\n'), 'error');
        return;
      }
      await Promise.all([loadProjects(), loadIssues(), loadPhotos()]);
      await recordBackupCreated(photos.length);
      showToast(`Restore complete. ${result.extractedPhotosCount} photos restored.`);
      setRestorePath('');
      setRestorePassphrase('');
      setShowRestoreModal(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Restore failed.', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleBackupFromSettings = async (): Promise<void> => {
    if (evaluatePassphraseStrength(backupPassphrase).tier === 'too-short') {
      showToast(`Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`, 'error');
      return;
    }
    setIsBackingUp(true);
    try {
      const result = await createBackup(backupPassphrase);
      await recordBackupCreated(photos.length);
      showToast(`Backup created (${formatBytes(result.fileSizeBytes)}).`);
      setBackupPassphrase('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Backup failed.', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const formatLastBackup = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const themeOptions: { key: ThemePreference; label: string; icon: typeof Sun }[] = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'System', icon: Smartphone },
  ];

  const autoLockOptions = [1, 5, 15, 30, 60];
  const { colors } = useTheme();

  return (
    <Screen header={<ScreenHeader title="Settings" />} pad>
      {/* Appearance */}
      <Section title="Appearance">
        <View
          style={styles.themeRow}
          accessibilityRole="radiogroup"
          accessibilityLabel="Theme selection"
        >
          {themeOptions.map(({ key, label, icon: Icon }) => {
            const isSelected = themeSetting === key;
            return (
              <Button
                key={key}
                title={label}
                icon={Icon}
                variant={isSelected ? 'primary' : 'secondary'}
                size="small"
                onPress={() => {
                  setTheme(key);
                }}
                style={[styles.themeButton, !isSelected && { borderColor: colors.border }]}
                accessibilityLabel={`Set theme to ${label}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              />
            );
          })}
        </View>
      </Section>

      {/* Accessibility & Security */}
      <Section title="Accessibility & Security">
        <ActionRow
          icon={Accessibility}
          label="Reduce Motion"
          trailing="switch"
          switchValue={reduceMotion}
          onSwitchChange={(value) => {
            void preferenceStore.setReduceMotion(value);
          }}
          accessibilityLabel="Reduce motion"
          accessibilityHint="Double-tap to toggle reduce motion"
        />
        <Divider spacing={spacing['2']} />
        <ActionRow
          icon={Accessibility}
          label="High Contrast"
          trailing="switch"
          switchValue={highContrast}
          onSwitchChange={(value) => {
            void preferenceStore.setHighContrast(value);
          }}
          accessibilityLabel="High contrast"
          accessibilityHint="Double-tap to toggle high contrast"
        />
        <Divider spacing={spacing['2']} />
        <ActionRow
          icon={Lock}
          label="Biometric Unlock"
          trailing="switch"
          switchValue={preferenceStore.biometricAuthEnabled}
          onSwitchChange={(value) => {
            void preferenceStore.setBiometricAuthEnabled(value);
          }}
          accessibilityLabel="Biometric unlock"
          accessibilityHint="Double-tap to toggle biometric unlock"
        />
        <Divider spacing={spacing['2']} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Timer size={20} color={colors.textSecondary} style={styles.toggleIcon} />
            <Typography variant="body" color="primary">
              Auto-Lock Timeout
            </Typography>
          </View>
          <View style={styles.chipRow}>
            {autoLockOptions.map((mins) => (
              <Button
                key={mins}
                title={`${mins}m`}
                size="small"
                variant={
                  preferenceStore.autoLockTimeout === mins * 60 * 1000 ? 'primary' : 'secondary'
                }
                onPress={() => {
                  void preferenceStore.setAutoLockTimeout(mins * 60 * 1000);
                }}
                style={styles.smallChip}
              />
            ))}
          </View>
        </View>
      </Section>

      {/* Company Branding */}
      <Section title="Company Branding">
        <TextInput
          label="Company Name"
          placeholder="Your company name"
          value={preferenceStore.companyName ?? ''}
          onChangeText={(value) => {
            void preferenceStore.setCompanyName(value || null);
          }}
          style={styles.brandingInput}
        />
        <TextInput
          label="Report Header"
          placeholder="Text to appear at the top of PDF reports"
          value={preferenceStore.reportHeaderText ?? ''}
          onChangeText={(value) => {
            void preferenceStore.setReportHeaderText(value || null);
          }}
          style={styles.brandingInput}
        />
        <TextInput
          label="Report Footer"
          placeholder="Text to appear at the bottom of PDF reports"
          value={preferenceStore.reportFooterText ?? ''}
          onChangeText={(value) => {
            void preferenceStore.setReportFooterText(value || null);
          }}
          style={styles.brandingInput}
        />
        <ActionRow
          icon={FileText}
          label="Manage Templates"
          onPress={() => router.push('/templates')}
          accessibilityLabel="Manage templates"
          accessibilityHint="Double-tap to manage project templates"
        />
      </Section>

      {/* Data Export */}
      <Section title="Data Export">
        <Typography variant="body" color="secondary" style={styles.description}>
          Export a single project to JSON, CSV, or ZIP format. PDF reports are available from the
          project screen.
        </Typography>

        <View style={styles.projectList}>
          <Typography variant="caption" color="secondary">
            Select Project
          </Typography>
          <View
            style={styles.projectChips}
            accessibilityRole="radiogroup"
            accessibilityLabel="Select project for export"
          >
            {projects.map((project) => {
              const isSelected = project.id === selectedProjectId;
              return (
                <Button
                  key={project.id}
                  title={project.name}
                  variant={isSelected ? 'primary' : 'secondary'}
                  size="small"
                  onPress={() => {
                    setSelectedProjectId(project.id);
                  }}
                  style={[styles.projectChip, !isSelected && { borderColor: colors.border }]}
                  accessibilityLabel={`Select project ${project.name}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                />
              );
            })}
          </View>
          {projects.length === 0 ? (
            <Typography variant="bodySmall" color="secondary">
              No projects available. Create a project first.
            </Typography>
          ) : null}
        </View>

        <TextInput
          label="Export Password (optional)"
          placeholder="Password-protect ZIP export"
          secureTextEntry
          value={exportPassword}
          onChangeText={setExportPassword}
          style={styles.passphraseInput}
        />

        <View style={styles.exportButtons}>
          {EXPORT_OPTIONS.map(({ format, title, icon: Icon }) => (
            <Button
              key={format}
              title={title}
              icon={Icon}
              variant="secondary"
              size="small"
              loading={isExporting === format}
              disabled={!selectedProjectId || isExporting !== null}
              onPress={() => {
                void handleExport(format);
              }}
              fullWidth
              style={styles.exportButton}
              accessibilityLabel={`Export as ${format.toUpperCase()}`}
            />
          ))}
        </View>
      </Section>

      {/* Export History */}
      <Section title="Export History">
        {exportHistory.length === 0 ? (
          <Typography variant="bodySmall" color="secondary">
            No exports yet.
          </Typography>
        ) : (
          <View style={styles.historyList}>
            {exportHistory.slice(0, 10).map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <View style={styles.historyRowLeft}>
                  <History size={16} color={colors.textTertiary} />
                  <Typography variant="bodySmall" color="primary" style={styles.historyFileName}>
                    {item.fileName}
                  </Typography>
                </View>
                <Typography variant="captionSmall" color="secondary">
                  {new Date(item.exportTimestamp).toLocaleDateString()} •{' '}
                  {formatBytes(item.fileSizeBytes ?? 0)}
                </Typography>
              </View>
            ))}
          </View>
        )}
        <Button
          title="Clear History"
          variant="secondary"
          size="small"
          icon={Trash2}
          onPress={() => {
            Alert.alert(
              'Clear Export History',
              'Are you sure you want to clear all export history? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => {
                    void clearExportHistory().then(() => {
                      setExportHistory([]);
                      showToast('Export history cleared');
                    });
                  },
                },
              ]
            );
          }}
          style={styles.clearHistoryButton}
          fullWidth
        />
      </Section>

      {/* Storage Management */}
      <Section title="Storage Management">
        <ActionRow icon={HardDrive} label="Estimated Cache Size" value={formatBytes(cacheSize)} />
        <Button
          title="Clear Cache"
          variant="secondary"
          size="small"
          icon={Trash2}
          loading={isClearingCache}
          disabled={isClearingCache}
          onPress={() => {
            Alert.alert(
              'Clear Cache',
              'Are you sure you want to clear the cache? This will free up storage space.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => {
                    setIsClearingCache(true);
                    void runFullCleanup().then((result) => {
                      setIsClearingCache(false);
                      void calculateCacheSize().then(setCacheSize);
                      showToast(`Freed ${formatBytes(result.bytesFreed)}`);
                    });
                  },
                },
              ]
            );
          }}
          fullWidth
          style={styles.clearCacheButton}
        />
      </Section>

      {/* Data & Backup */}
      <Section title="Data & Backup">
        <ActionRow
          icon={Database}
          label="Create Backup Now"
          onPress={() => router.push({ pathname: '/migration', params: { initialRole: 'old' } })}
          accessibilityLabel="Create backup now"
          accessibilityHint="Double-tap to start creating a backup"
        />
        <Divider spacing={spacing['2']} />
        <ActionRow
          icon={Upload}
          label="Restore from Backup"
          onPress={() => router.push({ pathname: '/migration', params: { initialRole: 'new' } })}
          accessibilityLabel="Restore from backup"
          accessibilityHint="Double-tap to restore data from a backup"
        />
        <Divider spacing={spacing['2']} />
        <ActionRow
          icon={Bell}
          label="Backup Reminders"
          trailing="switch"
          switchValue={preferenceStore.backupRemindersEnabled}
          onSwitchChange={(value) => {
            void preferenceStore.setBackupRemindersEnabled(value);
          }}
          accessibilityLabel="Backup reminders"
          accessibilityHint="Double-tap to toggle backup reminders"
        />
        <Divider spacing={spacing['2']} />
        <ActionRow
          icon={Clock}
          label="Last Backup"
          value={formatLastBackup(preferenceStore.backupReminderLastBackupDate)}
        />
        <Divider spacing={spacing['2']} />
        <ActionRow
          icon={Trash2}
          label="Trash"
          onPress={() => router.push('/trash' as never)}
          accessibilityLabel="Trash"
          accessibilityHint="Double-tap to view recently deleted items"
        />
        <Divider spacing={spacing['2']} />
        <ActionRow
          icon={Import}
          label="Import Project"
          onPress={() => router.push('/import' as never)}
          accessibilityLabel="Import project"
          accessibilityHint="Double-tap to import a project from JSON or ZIP"
        />
      </Section>

      {/* Legacy Backup & Restore */}
      <Section title="Legacy Backup & Restore">
        <Typography variant="body" color="secondary" style={styles.description}>
          Create an encrypted backup of your entire database and photos directly in settings.
        </Typography>

        <TextInput
          label="Backup Passphrase"
          placeholder={`Enter a strong passphrase (min ${MIN_PASSPHRASE_LENGTH} chars)`}
          secureTextEntry
          value={backupPassphrase}
          onChangeText={setBackupPassphrase}
          style={styles.passphraseInput}
        />
        {backupPassphrase.length > 0 ? (
          <View style={styles.passphraseMeter}>
            <PassphraseStrengthMeter strength={evaluatePassphraseStrength(backupPassphrase)} />
          </View>
        ) : null}

        <Button
          title="Create Encrypted Backup"
          icon={Download}
          loading={isBackingUp}
          disabled={
            isBackingUp || evaluatePassphraseStrength(backupPassphrase).tier === 'too-short'
          }
          onPress={() => {
            void handleBackupFromSettings();
          }}
          fullWidth
          style={styles.actionButton}
        />

        <Button
          title="Restore from Backup"
          icon={Upload}
          variant="secondary"
          onPress={() => {
            setShowRestoreModal(true);
          }}
          fullWidth
          style={styles.actionButton}
        />
      </Section>

      {/* Restore Modal */}
      <Modal
        visible={showRestoreModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowRestoreModal(false);
          AccessibilityInfo.announceForAccessibility('Restore backup dialog closed');
        }}
        accessibilityLabel="Restore backup dialog"
        accessibilityViewIsModal={true}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.scrim }]}>
          <Card style={styles.modalCard} elevation="3" accessibilityLabel="Restore from backup">
            <View style={styles.modalHeader}>
              <AlertTriangle size={28} color={colors.warning} />
              <Typography
                variant="headingSm"
                accessibilityRole="header"
                color="primary"
                style={styles.modalTitle}
              >
                Restore Backup
              </Typography>
            </View>
            <Typography variant="body" color="secondary" style={styles.modalText}>
              Restoring will overwrite your current database and photos. This cannot be undone.
            </Typography>
            <Button
              title={
                restorePath
                  ? (restorePath.split('/').pop() ?? 'Backup selected')
                  : 'Select Backup File'
              }
              variant="secondary"
              icon={restorePath ? FileCheck : Upload}
              onPress={() => {
                void (async (): Promise<void> => {
                  try {
                    const result = await DocumentPicker.getDocumentAsync({
                      type: 'application/octet-stream',
                      copyToCacheDirectory: false,
                    });
                    if (!result.canceled && result.assets && result.assets.length > 0) {
                      const asset = result.assets[0];
                      if (asset) setRestorePath(asset.uri);
                    }
                  } catch {
                    // User cancelled or picker failed
                  }
                })();
              }}
              fullWidth
              style={styles.modalInput}
              accessibilityLabel="Select backup file"
            />
            <TextInput
              label="Passphrase"
              placeholder="Enter backup passphrase"
              secureTextEntry
              value={restorePassphrase}
              onChangeText={setRestorePassphrase}
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setShowRestoreModal(false);
                }}
                style={styles.modalButton}
              />
              <Button
                title="Restore"
                variant="destructive"
                loading={isRestoring}
                disabled={isRestoring}
                onPress={() => {
                  void handleRestore();
                }}
                style={styles.modalButton}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {toast ? (
        <View style={styles.toastContainer}>
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  themeRow: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  themeButton: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing['2'],
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    marginRight: spacing['3'],
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  smallChip: {
    marginRight: 0,
    marginBottom: 0,
    paddingHorizontal: spacing['2'],
  },
  description: {
    marginBottom: spacing['4'],
  },
  projectList: {
    marginBottom: spacing['4'],
    gap: spacing['2'],
  },
  projectChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['2'],
  },
  projectChip: {
    marginRight: 0,
    marginBottom: 0,
  },
  exportButtons: {
    gap: spacing['2'],
  },
  exportButton: {
    justifyContent: 'flex-start',
  },
  passphraseInput: {
    marginBottom: spacing['4'],
  },
  passphraseMeter: {
    marginTop: -spacing['3'],
    marginBottom: spacing['4'],
  },
  brandingInput: {
    marginBottom: spacing['3'],
  },
  actionButton: {
    marginBottom: spacing['3'],
  },
  historyList: {
    gap: spacing['2'],
    marginBottom: spacing['3'],
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing['2'],
  },
  historyFileName: {
    marginLeft: spacing['2'],
  },
  clearHistoryButton: {
    marginTop: spacing['2'],
  },
  clearCacheButton: {
    marginTop: spacing['2'],
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
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['3'],
  },
  modalTitle: {
    marginLeft: spacing['3'],
  },
  modalText: {
    marginBottom: spacing['4'],
  },
  modalInput: {
    marginBottom: spacing['3'],
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing['3'],
    marginTop: spacing['2'],
  },
  modalButton: {
    minWidth: 100,
  },
  toastContainer: {
    position: 'absolute',
    bottom: spacing['6'],
    left: spacing['4'],
    right: spacing['4'],
  },
});
