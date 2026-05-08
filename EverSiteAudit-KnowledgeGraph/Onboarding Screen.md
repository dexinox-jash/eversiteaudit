---
type: screen
path: src/app/onboarding.tsx
---

# Onboarding Screen

First-launch onboarding wizard.

## State

- `pageIndex`
- `cameraPermission`
- `showProfileSetup`
- `showTemplateSelection`
- `inspectorName`, `inspectorCompany`
- `selectedTemplateId`
- `templates` — loaded from `templateRepository.getByType('project_structure')`
- `isLoadingTemplates`
- `generalError`, `creationError`

## Behavior

- Multi-page wizard using `FlatList` with 3 carousel pages
- `getItemLayout` provided for reliable `scrollToIndex`
- `onScrollToIndexFailed` falls back to `scrollToOffset`
- **Android fix:** `scrollEnabled={false}` removed from `FlatList` (broke `scrollToIndex` on Android); `scrollable={false}` added to `Screen` instead
- Camera permission request via `expo-camera` with 5s timeout guard (`Promise.race`)
- Profile setup (inspector name + company)
- Template selection for first project — queries real templates from repository
- Blank template detected via `isDefault === 1` flag (not name matching)
- Skip button calls `finishOnboarding()` directly with error handling

## Components

- `Screen`, `Typography`, `Button`, `TextInput`, `FlatList`

## Services

- `templateRepository`
- `createProjectFromTemplate`
- `expo-camera`

## Stores

- `usePreferenceStore`, `useProjectStore`

## Related

- [[Root Layout]] — triggers `router.replace('/onboarding')` if incomplete
- [[App Navigation Index]]
- [[Template Repository]]
- [[New Project Screen]]
