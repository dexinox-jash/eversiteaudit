import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Check, FileText, Shield, Camera as CameraIcon } from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import { Screen, Button } from '@components/index';
import { usePreferenceStore } from '@store/usePreferenceStore';
import { Camera } from 'expo-camera';
import { useProjectStore } from '@store/useProjectStore';
import { createProjectFromTemplate } from '@services/template/templateService';
import { templateRepository } from '@services/db/repositories';
import type { Template } from '@/types/domain';
import type { OnboardingPage } from './onboarding/OnboardingCarousel';
import OnboardingCarousel from './onboarding/OnboardingCarousel';
import ProfileSetupForm from './onboarding/ProfileSetupForm';
import TemplateSelector from './onboarding/TemplateSelector';
import ErrorBanner from './onboarding/ErrorBanner';
import { spacing } from '@theme/index';

const PAGES: OnboardingPage[] = [
  {
    key: 'welcome',
    title: 'Welcome to EverSiteAudit',
    description:
      'Professional site auditing, completely offline. Your data stays on your device until you decide to share it.',
    icon: FileText,
  },
  {
    key: 'privacy',
    title: 'Privacy-First Design',
    description:
      'Military-grade AES-256 encryption. Zero auto-transmission. No cloud dependency. Your inspection data is yours alone.',
    icon: Shield,
  },
  {
    key: 'camera',
    title: 'Capture with Confidence',
    description:
      'Use the camera to document issues with photos, annotations, and severity tags. We need camera permission to get started.',
    icon: CameraIcon,
  },
];

export default function OnboardingScreen(): JSX.Element {
  const { colors } = useTheme();
  const { setHasCompletedOnboarding, setInspectorName, setInspectorCompany, reduceMotion } =
    usePreferenceStore();
  const { createProject, loadProjects } = useProjectStore();
  const [pageIndex, setPageIndex] = useState(0);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [inspectorName, setLocalInspectorName] = useState('');
  const [inspectorCompany, setLocalInspectorCompany] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const flatListRef = useRef<FlatList<OnboardingPage>>(null);
  const isProcessing = useRef(false);

  // Load templates from repository
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
          setGeneralError(err instanceof Error ? err.message : 'Failed to load templates');
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

  const finishOnboarding = useCallback(async (): Promise<void> => {
    await setHasCompletedOnboarding(true);
    router.replace('/(tabs)');
  }, [setHasCompletedOnboarding]);

  const handleNext = useCallback(async (): Promise<void> => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setCreationError(null);
    setGeneralError(null);

    try {
      if (pageIndex < PAGES.length - 1) {
        const nextIndex = pageIndex + 1;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: !reduceMotion });
        setPageIndex(nextIndex);
        isProcessing.current = false;
        return;
      }

      // Camera permission step
      if (cameraPermission === null) {
        try {
          const permissionResult = await Promise.race([
            Camera.requestCameraPermissionsAsync(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Camera permission request timed out')), 5000)
            ),
          ]);
          setCameraPermission((permissionResult.status as string) === 'granted');
        } catch {
          setCameraPermission(false);
        }
        isProcessing.current = false;
        return;
      }

      // Profile setup step
      if (!showProfileSetup) {
        setShowProfileSetup(true);
        isProcessing.current = false;
        return;
      }

      // Template selection step
      if (!showTemplateSelection) {
        setShowTemplateSelection(true);
        isProcessing.current = false;
        return;
      }

      // Save profile info
      if (inspectorName.trim()) {
        await setInspectorName(inspectorName.trim());
      }
      if (inspectorCompany.trim()) {
        await setInspectorCompany(inspectorCompany.trim());
      }

      // Create project from template
      if (selectedTemplateId) {
        setIsCreating(true);
        const blankTemplate = templates.find((t) => t.isDefault === 1);
        const projectPayload = {
          name: 'My First Project',
          description: '',
          clientName: inspectorCompany.trim() || null,
        };

        try {
          if (selectedTemplateId === blankTemplate?.id) {
            await createProject(projectPayload);
          } else {
            await createProjectFromTemplate(selectedTemplateId, projectPayload);
          }
          await loadProjects();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          setCreationError(`Could not create project: ${message}`);
          setIsCreating(false);
          isProcessing.current = false;
          return;
        }
        setIsCreating(false);
      }

      await finishOnboarding();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setGeneralError(message);
    } finally {
      isProcessing.current = false;
    }
  }, [
    pageIndex,
    cameraPermission,
    showProfileSetup,
    showTemplateSelection,
    selectedTemplateId,
    inspectorName,
    inspectorCompany,
    finishOnboarding,
    createProject,
    loadProjects,
    setInspectorName,
    setInspectorCompany,
    templates,
    reduceMotion,
  ]);

  const handleSkip = useCallback(async (): Promise<void> => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setGeneralError(null);

    try {
      await finishOnboarding();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setGeneralError(`Could not skip onboarding: ${message}`);
    } finally {
      isProcessing.current = false;
    }
  }, [finishOnboarding]);

  const handleBack = useCallback((): void => {
    if (showTemplateSelection) {
      setShowTemplateSelection(false);
      return;
    }
    if (showProfileSetup) {
      setShowProfileSetup(false);
      return;
    }
    if (pageIndex > 0) {
      const prevIndex = pageIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: !reduceMotion });
      setPageIndex(prevIndex);
    }
  }, [showTemplateSelection, showProfileSetup, pageIndex, reduceMotion]);

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      console.warn('[Onboarding] scrollToIndex failed:', info);
      const offset = info.index * info.averageItemLength;
      flatListRef.current?.scrollToOffset({ offset, animated: !reduceMotion });
      setPageIndex(info.index);
    },
    [reduceMotion]
  );

  const buttonTitle = ((): string => {
    if (pageIndex < PAGES.length - 1) return 'Next';
    if (cameraPermission === null) return 'Next';
    if (!showProfileSetup) return 'Next';
    if (!showTemplateSelection) return 'Next';
    if (selectedTemplateId) return 'Get Started';
    return 'Next';
  })();

  const errorMessage = creationError ?? generalError;

  return (
    <Screen pad scrollable={false} style={{ backgroundColor: colors.background }}>
      <View style={styles.skipContainer}>
        <Button
          title="Skip"
          variant="ghost"
          size="small"
          onPress={() => {
            void handleSkip();
          }}
          accessibilityLabel="Skip onboarding"
          accessibilityHint="Double-tap to skip the onboarding flow"
        />
      </View>

      {!showProfileSetup && !showTemplateSelection ? (
        <View style={styles.carouselContainer}>
          <OnboardingCarousel
            ref={flatListRef}
            pages={PAGES}
            pageIndex={pageIndex}
            onPageIndexChange={setPageIndex}
            onScrollToIndexFailed={handleScrollToIndexFailed}
          />
        </View>
      ) : null}

      {showProfileSetup && !showTemplateSelection ? (
        <ProfileSetupForm
          inspectorName={inspectorName}
          inspectorCompany={inspectorCompany}
          onNameChange={setLocalInspectorName}
          onCompanyChange={setLocalInspectorCompany}
        />
      ) : null}

      {showTemplateSelection ? (
        <TemplateSelector
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          isLoading={isLoadingTemplates}
          onSelect={(id) => {
            setSelectedTemplateId(id);
            setCreationError(null);
          }}
        />
      ) : null}

      <ErrorBanner error={errorMessage} />

      <View style={styles.footer}>
        {(pageIndex > 0 || showProfileSetup || showTemplateSelection) && (
          <Button
            title="Back"
            variant="secondary"
            onPress={() => {
              void handleBack();
            }}
            accessibilityLabel="Go back"
          />
        )}
        <Button
          title={buttonTitle}
          icon={buttonTitle === 'Get Started' ? Check : ChevronRight}
          onPress={() => {
            void handleNext();
          }}
          loading={isCreating}
          disabled={isCreating || (showTemplateSelection && !selectedTemplateId)}
          accessibilityLabel={buttonTitle === 'Get Started' ? 'Get started' : 'Next page'}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  skipContainer: {
    alignItems: 'flex-end',
    marginTop: spacing['4'],
  },
  carouselContainer: {
    flex: 1,
  },
  footer: {
    paddingBottom: spacing['8'],
    paddingHorizontal: spacing['4'],
    gap: spacing['4'],
  },
});
