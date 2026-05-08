import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Share2,
  RefreshCw,
  FileArchive,
  Camera,
  ClipboardList,
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  Screen,
  Typography,
  Card,
  Button,
  TextInput,
  PassphraseStrengthMeter,
} from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { spacing, touchTargets } from '@theme/index';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import { createBackup, restoreBackup, computeSha256 } from '@services/backup';
import { recordBackupCreated } from '@services/backup/reminderService';
import {
  evaluatePassphraseStrength,
  MIN_PASSPHRASE_LENGTH,
} from '@services/security/passphraseStrength';
import type { BackupResult, RestoreResult } from '@services/backup/types';

type WizardStep = 'intro' | 'old-device' | 'new-device' | 'success' | 'error';
type DeviceRole = 'old' | 'new' | null;

interface WizardError {
  title: string;
  message: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function MigrationWizardScreen(): JSX.Element {
  const { colors } = useTheme();
  const { projects } = useProjectStore();
  const { issues } = useIssueStore();
  const { photos } = usePhotoStore();
  const { initialRole } = useLocalSearchParams<{ initialRole?: 'old' | 'new' }>();

  const [step, setStep] = useState<WizardStep>(
    initialRole === 'old' || initialRole === 'new'
      ? initialRole === 'old'
        ? 'old-device'
        : 'new-device'
      : 'intro'
  );
  const [role, setRole] = useState<DeviceRole>(initialRole ?? null);
  const [passphrase, setPassphrase] = useState('');
  const [restorePath, setRestorePath] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<BackupResult | null>(null);
  const [backupChecksum, setBackupChecksum] = useState<string>('');
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [error, setError] = useState<WizardError | null>(null);

  const totalPhotos = photos.length;
  const totalIssues = issues.length;
  const totalProjects = projects.length;

  useEffect(() => {
    if (!initialRole) {
      setStep('intro');
      setRole(null);
    }
    setPassphrase('');
    setRestorePath('');
    setRestorePassphrase('');
    setBackupResult(null);
    setBackupChecksum('');
    setRestoreResult(null);
    setError(null);
  }, [initialRole]);

  const handleSelectRole = useCallback((selectedRole: DeviceRole) => {
    setRole(selectedRole);
    setStep(selectedRole === 'old' ? 'old-device' : 'new-device');
  }, []);

  const handleCreateBackup = useCallback(async (): Promise<void> => {
    if (evaluatePassphraseStrength(passphrase).tier === 'too-short') {
      setError({
        title: 'Invalid Passphrase',
        message: `Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`,
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await createBackup(passphrase);
      const checksum = await computeSha256(result.uri);
      setBackupResult(result);
      setBackupChecksum(checksum);
      // Backup path stored in result.uri
      await recordBackupCreated(totalPhotos);
      setStep('success');
    } catch (err) {
      setError({
        title: 'Backup Failed',
        message: err instanceof Error ? err.message : 'Failed to create backup. Please try again.',
      });
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [passphrase, totalPhotos]);

  const handleRestoreBackup = useCallback(async (): Promise<void> => {
    if (!restorePath || !restorePassphrase) {
      setError({
        title: 'Missing Information',
        message: 'Please enter both backup path and passphrase.',
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await restoreBackup(restorePath, restorePassphrase);
      if (!result.success) {
        setError({
          title: 'Restore Failed',
          message:
            result.errors.join('\n') ||
            'Unable to restore backup. Please verify the file and passphrase.',
        });
        setStep('error');
        return;
      }
      setRestoreResult(result);
      setStep('success');
    } catch (err) {
      setError({
        title: 'Restore Failed',
        message: err instanceof Error ? err.message : 'Failed to restore backup. Please try again.',
      });
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [restorePath, restorePassphrase]);

  const handleShareBackup = useCallback(async (): Promise<void> => {
    if (backupResult?.uri) {
      try {
        await Sharing.shareAsync(backupResult.uri);
      } catch {
        // User cancelled or share failed
      }
    }
  }, [backupResult]);

  const handleRetry = useCallback((): void => {
    setError(null);
    setStep(role === 'old' ? 'old-device' : 'new-device');
  }, [role]);

  const handleBack = useCallback((): void => {
    if (step === 'old-device' || step === 'new-device') {
      setStep('intro');
      setRole(null);
    } else if (step === 'success' || step === 'error') {
      setStep(role === 'old' ? 'old-device' : 'new-device');
    } else {
      router.back();
    }
  }, [step, role]);

  const renderStepIndicator = (): JSX.Element => {
    const steps =
      role === 'old'
        ? ['Intro', 'Create Backup', 'Complete']
        : ['Intro', 'Import Backup', 'Complete'];
    const currentIndex =
      step === 'intro' ? 0 : step === 'old-device' || step === 'new-device' ? 1 : 2;

    return (
      <View style={styles.stepIndicator}>
        {steps.map((label, index) => (
          <View key={label} style={styles.stepIndicatorItem}>
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    index <= currentIndex ? colors.primary : colors.backgroundTertiary,
                },
              ]}
            />
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor:
                      index < currentIndex ? colors.primary : colors.backgroundTertiary,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderIntroStep = (): JSX.Element => (
    <View style={styles.stepContent}>
      <Typography
        variant="headingMd"
        accessibilityRole="header"
        color="primary"
        style={styles.title}
      >
        Transfer to New Device
      </Typography>
      <Typography variant="body" color="secondary" style={styles.description}>
        Securely transfer all your projects, issues, and photos to a new device using an encrypted
        backup. Your data stays private with passphrase protection.
      </Typography>

      <View style={styles.roleCards}>
        <Pressable
          onPress={() => handleSelectRole('old')}
          style={[styles.roleCard, { backgroundColor: colors.backgroundSecondary }]}
          accessibilityRole="button"
          accessibilityLabel="This is my old device"
          accessibilityHint="Double-tap to create an encrypted backup"
        >
          <Download size={40} color={colors.primary} />
          <Typography
            variant="headingSm"
            accessibilityRole="header"
            color="primary"
            style={styles.roleCardTitle}
          >
            This is my old device
          </Typography>
          <Typography variant="bodySmall" color="secondary" style={styles.roleCardDesc}>
            Create an encrypted backup to transfer
          </Typography>
        </Pressable>

        <Pressable
          onPress={() => handleSelectRole('new')}
          style={[styles.roleCard, { backgroundColor: colors.backgroundSecondary }]}
          accessibilityRole="button"
          accessibilityLabel="This is my new device"
          accessibilityHint="Double-tap to import a backup from your old device"
        >
          <Upload size={40} color={colors.primary} />
          <Typography
            variant="headingSm"
            accessibilityRole="header"
            color="primary"
            style={styles.roleCardTitle}
          >
            This is my new device
          </Typography>
          <Typography variant="bodySmall" color="secondary" style={styles.roleCardDesc}>
            Import a backup from your old device
          </Typography>
        </Pressable>
      </View>
    </View>
  );

  const renderOldDeviceStep = (): JSX.Element => (
    <ScrollView
      style={styles.stepScroll}
      contentContainerStyle={styles.stepScrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Typography
        variant="headingMd"
        accessibilityRole="header"
        color="primary"
        style={styles.title}
      >
        Create Backup
      </Typography>

      <Card style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary }]}>
        <Typography
          variant="headingSm"
          accessibilityRole="header"
          color="primary"
          style={styles.summaryTitle}
        >
          Backup Summary
        </Typography>
        <View style={styles.summaryRow}>
          <ClipboardList size={20} color={colors.textSecondary} />
          <Typography variant="body" color="secondary">
            {totalProjects} project{totalProjects !== 1 ? 's' : ''}
          </Typography>
        </View>
        <View style={styles.summaryRow}>
          <AlertCircle size={20} color={colors.textSecondary} />
          <Typography variant="body" color="secondary">
            {totalIssues} issue{totalIssues !== 1 ? 's' : ''}
          </Typography>
        </View>
        <View style={styles.summaryRow}>
          <Camera size={20} color={colors.textSecondary} />
          <Typography variant="body" color="secondary">
            {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
          </Typography>
        </View>
      </Card>

      <TextInput
        label="Backup Passphrase"
        placeholder={`Enter a strong passphrase (min ${MIN_PASSPHRASE_LENGTH} chars)`}
        secureTextEntry
        value={passphrase}
        onChangeText={setPassphrase}
        style={styles.input}
      />
      {passphrase.length > 0 ? (
        <View style={styles.meterWrap}>
          <PassphraseStrengthMeter strength={evaluatePassphraseStrength(passphrase)} />
        </View>
      ) : null}

      <Button
        title="Create Backup"
        icon={FileArchive}
        loading={isLoading}
        disabled={isLoading || evaluatePassphraseStrength(passphrase).tier === 'too-short'}
        onPress={() => void handleCreateBackup()}
        fullWidth
        style={styles.actionButton}
        accessibilityLabel="Create backup"
      />

      {isLoading && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body" color="secondary" style={styles.progressText}>
            Encrypting and packaging your data...
          </Typography>
        </View>
      )}
    </ScrollView>
  );

  const renderNewDeviceStep = (): JSX.Element => (
    <ScrollView
      style={styles.stepScroll}
      contentContainerStyle={styles.stepScrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Typography
        variant="headingMd"
        accessibilityRole="header"
        color="primary"
        style={styles.title}
      >
        Import Backup
      </Typography>

      <Typography variant="body" color="secondary" style={styles.description}>
        Enter the path to your backup file and the passphrase used to encrypt it.
      </Typography>

      <Button
        title={
          restorePath ? (restorePath.split('/').pop() ?? 'Backup selected') : 'Select Backup File'
        }
        variant="secondary"
        icon={Upload}
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
        style={styles.input}
        accessibilityLabel="Select backup file"
      />

      <TextInput
        label="Passphrase"
        placeholder="Enter backup passphrase"
        secureTextEntry
        value={restorePassphrase}
        onChangeText={setRestorePassphrase}
        style={styles.input}
      />

      <Button
        title="Import Backup"
        icon={Upload}
        loading={isLoading}
        disabled={isLoading || !restorePath || !restorePassphrase}
        onPress={() => void handleRestoreBackup()}
        fullWidth
        style={styles.actionButton}
        accessibilityLabel="Import backup"
      />

      {isLoading && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body" color="secondary" style={styles.progressText}>
            Decrypting and restoring your data...
          </Typography>
        </View>
      )}
    </ScrollView>
  );

  const renderSuccessStep = (): JSX.Element => (
    <View style={styles.stepContent}>
      <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
        <CheckCircle size={64} color={colors.success} />
      </View>

      <Typography
        variant="headingMd"
        accessibilityRole="header"
        color="primary"
        style={styles.title}
      >
        {role === 'old' ? 'Backup Created' : 'Restore Complete'}
      </Typography>

      {role === 'old' && backupResult && (
        <Card style={[styles.resultCard, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.resultRow}>
            <Typography variant="caption" color="secondary">
              File
            </Typography>
            <Typography variant="bodySmall" color="primary" style={styles.resultValue}>
              {backupResult.fileName}
            </Typography>
          </View>
          <View style={styles.resultRow}>
            <Typography variant="caption" color="secondary">
              Size
            </Typography>
            <Typography variant="bodySmall" color="primary" style={styles.resultValue}>
              {formatBytes(backupResult.fileSizeBytes)}
            </Typography>
          </View>
          <View style={styles.resultRow}>
            <Typography variant="caption" color="secondary">
              Checksum
            </Typography>
            <Typography
              variant="bodySmall"
              color="primary"
              style={[styles.resultValue, styles.checksum]}
            >
              {backupChecksum}
            </Typography>
          </View>
          <View style={styles.resultActions}>
            <Button
              title="Share Backup"
              icon={Share2}
              variant="secondary"
              size="small"
              onPress={() => void handleShareBackup()}
              style={styles.resultButton}
              accessibilityLabel="Share backup file"
            />
          </View>
        </Card>
      )}

      {role === 'new' && restoreResult && (
        <Card style={[styles.resultCard, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.resultRow}>
            <Typography variant="caption" color="secondary">
              Photos Restored
            </Typography>
            <Typography variant="bodySmall" color="primary" style={styles.resultValue}>
              {restoreResult.extractedPhotosCount}
            </Typography>
          </View>
          <View style={styles.resultRow}>
            <Typography variant="caption" color="secondary">
              Status
            </Typography>
            <Typography variant="bodySmall" color="primary" style={styles.resultValue}>
              Verified
            </Typography>
          </View>
        </Card>
      )}

      <Typography variant="body" color="secondary" style={styles.nextSteps}>
        {role === 'old'
          ? 'Share or transfer this backup file to your new device, then open the app and select "This is my new device".'
          : 'Your restore will complete automatically on the next app restart. No manual action needed.'}
      </Typography>

      <Button
        title="Done"
        onPress={() => router.back()}
        fullWidth
        style={styles.actionButton}
        accessibilityLabel="Done"
      />
    </View>
  );

  const renderErrorStep = (): JSX.Element => (
    <View style={styles.stepContent}>
      <View style={[styles.errorIcon, { backgroundColor: colors.error + '20' }]}>
        <AlertCircle size={64} color={colors.error} />
      </View>

      <Typography
        variant="headingMd"
        accessibilityRole="header"
        color="primary"
        style={styles.title}
      >
        {error?.title ?? 'Something Went Wrong'}
      </Typography>

      <Typography variant="body" color="secondary" style={styles.errorMessage}>
        {error?.message ?? 'An unexpected error occurred. Please try again.'}
      </Typography>

      <Button
        title="Try Again"
        icon={RefreshCw}
        onPress={handleRetry}
        fullWidth
        style={styles.actionButton}
        accessibilityLabel="Try again"
      />

      <Button
        title="Go Back"
        variant="secondary"
        onPress={handleBack}
        fullWidth
        style={styles.actionButton}
        accessibilityLabel="Go back"
      />
    </View>
  );

  return (
    <Screen
      header={{
        title: 'Device Migration',
        leftIcon: ChevronLeft,
        onLeftPress: handleBack,
      }}
      scrollable={false}
      pad
    >
      {step !== 'success' && step !== 'error' && renderStepIndicator()}

      {step === 'intro' && renderIntroStep()}
      {step === 'old-device' && renderOldDeviceStep()}
      {step === 'new-device' && renderNewDeviceStep()}
      {step === 'success' && renderSuccessStep()}
      {step === 'error' && renderErrorStep()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['6'],
    gap: spacing['2'],
  },
  stepIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: spacing['2'],
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2'],
  },
  stepScroll: {
    flex: 1,
  },
  stepScrollContent: {
    paddingHorizontal: spacing['2'],
    paddingBottom: spacing['6'],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing['3'],
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing['6'],
    paddingHorizontal: spacing['4'],
  },
  roleCards: {
    width: '100%',
    gap: spacing['4'],
  },
  roleCard: {
    borderRadius: 12,
    padding: spacing['6'],
    alignItems: 'center',
    minHeight: touchTargets.minimum * 3,
    justifyContent: 'center',
  },
  roleCardTitle: {
    marginTop: spacing['4'],
    marginBottom: spacing['2'],
  },
  roleCardDesc: {
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    padding: spacing['4'],
    borderRadius: 12,
    marginBottom: spacing['6'],
  },
  summaryTitle: {
    marginBottom: spacing['4'],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
    marginBottom: spacing['3'],
    minHeight: touchTargets.minimum,
  },
  input: {
    width: '100%',
    marginBottom: spacing['4'],
  },
  meterWrap: {
    width: '100%',
    marginTop: -spacing['3'],
    marginBottom: spacing['4'],
  },
  actionButton: {
    width: '100%',
    marginBottom: spacing['3'],
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: spacing['4'],
  },
  progressText: {
    marginTop: spacing['3'],
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['6'],
  },
  errorIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['6'],
  },
  resultCard: {
    width: '100%',
    padding: spacing['4'],
    borderRadius: 12,
    marginBottom: spacing['6'],
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['3'],
    minHeight: touchTargets.minimum,
  },
  resultValue: {
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing['4'],
  },
  checksum: {
    fontFamily: 'monospace',
  },
  resultActions: {
    marginTop: spacing['2'],
    alignItems: 'flex-start',
  },
  resultButton: {
    minWidth: 140,
  },
  nextSteps: {
    textAlign: 'center',
    marginBottom: spacing['6'],
    paddingHorizontal: spacing['4'],
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: spacing['6'],
    paddingHorizontal: spacing['4'],
  },
});
