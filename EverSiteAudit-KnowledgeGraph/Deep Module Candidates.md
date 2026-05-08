---
type: architecture
analysis: deep-modules
---

# Deep Module Candidates

Opportunities to deepen shallow modules per `improve-codebase-architecture` heuristics.

## 1. Optimistic UI Abstraction

**Cluster:** `useProjectStore`, `useIssueStore`, `usePhotoStore`, `useAnnotationStore`

Each store re-implements the same optimistic-create pattern (~40–60 lines):
1. Generate `tempId` with `crypto.randomUUID()`
2. Build temp domain object
3. `set(state => prepend temp)`
4. Await repository call
5. Replace temp ID on success / filter out on failure

**Proposal:** Shared `createOptimisticStore` factory or mixin.

## 2. Export Data Builder

**Cluster:** `pdfExport.ts`, `zipExport.ts`, `jsonExport.ts`, `csvExport.ts`

Each format independently fetches and shapes the same data. A single `ExportDataBuilder` could fetch once and transform per format.

## 3. Column Encryption Mapper

**Cluster:** All repositories

Repositories imperatively call `encryptField`/`decryptField` for each sensitive column. A declarative column mapper or decorator would eliminate this boilerplate and prevent missed columns.

## 4. Preferences as Generic Pattern

**Cluster:** `preferences.ts`, `usePreferenceStore`, `SettingsRepository`

Preferences use a healthy deep-module pattern (18 key translation layer) that is inconsistent with other domains. Could be generalized as `createSettingsStore(domain, keys)`.

## 5. Service Façade

**Cluster:** `src/services/` directory

Mixes business-logic services (export, backup) with data-access repositories. A clear service façade would separate these layers.

## Related

- [[Architecture Index]]
- [[Coupling Hotspots]]
