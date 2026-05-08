---
type: screen
path: src/app/(tabs)/projects/new.tsx
---

# New Project Screen

Create a new project from a template.

## State

- `name`, `siteAddress`, `clientName`, `description`
- `selectedTemplateId`
- `templates` — loaded from `templateRepository.getByType('project_structure')`
- `isLoadingTemplates`, `templateError`

## Components

- `Screen` with `Header` (back arrow)
- `TextInput` fields
- Horizontal `ScrollView` of template chips with visual selection state
- `Button` to create

## Services

- `templateRepository`
- `createProjectFromTemplate`
- `hapticSuccess`

## Blank Template Detection

Uses `template.isDefault === 1` (not fragile name matching). If the selected template is the default/blank one, creates a plain project; otherwise uses `createProjectFromTemplate`.

## Stores

- `useProjectStore`

## Related

- [[Projects List Screen]]
- [[Project Detail Screen]]
- [[Template Service]]
- [[App Navigation Index]]
