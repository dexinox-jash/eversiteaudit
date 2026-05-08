# Phase B Performance Optimization Handoff

## Summary

Profiled and optimized performance-critical screens across the EverSiteAudit React Native app. All changes are minimal and focused. The verification gate (`npm run verify`) remains green: **63 test suites, 452 tests passed**.

## Changes Made

### 1. Gallery Grid (`src/app/(tabs)/gallery.tsx`)
- **Virtualization**: `FlatList` was already in place with `numColumns={3}`; no structural change needed.
- **Component memoization**: Wrapped `PhotoGridItem` with `React.memo` to prevent re-renders of unchanged grid cells.
- **Stable render callback**: Extracted `FlatList` `renderItem` into a `useCallback` hook so the function reference stays stable across parent renders.
- **List tuning props**: Added `initialNumToRender={12}`, `maxToRenderPerBatch={12}`, `windowSize={5}`, and `updateCellsBatchingPeriod={50}` to reduce JS thread pressure during fast scrolling.

### 2. Issue List (`src/app/projects/[id].tsx`)
- **Component memoization**: Wrapped `IssueRow` with `React.memo`.
- **Stable render callback**: Extracted issue `FlatList` `renderItem` into `renderIssueItem` via `useCallback`.
- **List tuning props**: Added `initialNumToRender={10}`, `maxToRenderPerBatch={10}`, `windowSize={5}`, and `updateCellsBatchingPeriod={50}`.
- **Existing memoization**: `filteredIssues` was already memoized with `useMemo`; left untouched.

### 3. Photo Grid (`src/app/projects/[id].tsx`)
- **Component memoization**: Wrapped `PhotoGridItem` with `React.memo`.
- **Stable render callback**: Extracted photo `FlatList` `renderItem` into `renderPhotoItem` via `useCallback`.
- **List tuning props**: Added `initialNumToRender={12}`, `maxToRenderPerBatch={12}`, `windowSize={5}`, and `updateCellsBatchingPeriod={50}`.

### 4. PDF Export (`src/services/export/pdfExport.ts`)
- **Batched async I/O**: Replaced the sequential `for...of` loop that awaited `annotationRepository.getByPhotoId` for each photo with a single `Promise.all` map. This parallelizes annotation lookups and removes the synchronous-tight-loop bottleneck.
- **Progress callback**: Simplified progress reporting to a single `onProgress?.(100)` call after batch completion.

### 5. Incidental Fix (`src/app/camera.tsx`)
- Fixed a pre-existing TypeScript error (`TS2304: Cannot find name 'index'`) in the photo strip `map` callback by adding the missing `index` parameter. This was required to keep `npm run verify` green.

## Benchmark Notes

- **Before**: Gallery and project-detail screens re-created inline `renderItem` closures on every parent render, causing every list row to re-evaluate. PDF export performed annotation queries serially, blocking the export pipeline as photo count grew.
- **After**:
  - List rows/grid items now skip React reconciliation when their props are unchanged (`React.memo` + stable callbacks).
  - FlatList tuning reduces the number of items mounted on first paint and during scroll.
  - PDF annotation lookup latency drops from O(n) sequential to O(1) parallelized wall-clock time (bounded by DB concurrency).
- **Verification**: `npm run verify` (typecheck + lint + test) passes with zero errors and the same 23 pre-existing lint warnings.

## Todo List Update

No standalone project todo file was found in the working tree; no separate todo update was made.
