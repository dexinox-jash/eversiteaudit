---
type: architecture
domain: data-safety
---

# Restore Atomicity

## Problem

Pre-v5, the backup restore flow was a staged-then-swap pattern with no
crash-recovery guarantee. `BackupExtractor.ts` wrote a
`RESTORE_PENDING.json` marker, and `connection.ts::applyPendingRestore()` then
closed the live DB and copied the staged DB over it. If the app crashed
between `closeDatabase()` and the `copyAsync` completing, the live DB could
be destroyed while the staged DB was not yet in place.

See [[AES Mode Discrepancy]] for the sibling P0 that landed in the same
batch as this fix ([[Crypto Migration v5]]).

## Design — State Machine

The marker now carries a `seq` id and a `state` that drives a recoverable
state machine on next launch.

```
RESTORE_PENDING.json:
  {
    "seq": "<timestamp>-<8-byte-hex>",
    "state": "staged" | "swap-in-progress" | "committed",
    "stagedDbPath": "...",
    "liveDbBackupPath": "..."
  }
```

### Flow under normal conditions

1. `restoreBackup()` (`src/services/backup/BackupExtractor.ts`) writes the
   marker with `state: "staged"`.
2. On next launch, `applyPendingRestore()` (`src/services/db/connection.ts`)
   sees `staged`. It copies the current live DB to `liveDbBackupPath`,
   updates the marker to `swap-in-progress`, copies staged → live, updates
   the marker to `committed`, then deletes staged, backup, and marker.

### Crash recovery

- **Crash during the live-DB-backup step (still `staged`)**: re-running the
  state machine simply retries from `staged`. The staged DB is untouched, the
  live DB is untouched. No data loss.
- **Crash during the staged-→-live copy (`swap-in-progress`)**: on restart,
  check which sources still exist:
  - Staged DB still present → retry `copyAsync` to finish the swap.
  - Staged DB gone, backup present → restore from `liveDbBackupPath`
    (roll back to pre-restore state).
  - Neither present → no safe action; clear the marker.
- **Crash after `committed`**: on restart, state machine just cleans up
  lingering staged/backup/marker files — the swap already completed.

### Legacy marker tolerance

Markers written by pre-v5 builds contain only `{ stagedDbPath }`. The reader
treats a missing `seq` / `state` / `liveDbBackupPath` as an implicit `staged`
entry and synthesises the missing fields so the v5 state machine can still
drive the swap to completion.

## Tests

- `tests/services/db/connection.test.ts` covers:
  - No marker → no-op
  - `staged` → full swap + cleanup (2 copies, 3 deletes)
  - `swap-in-progress` + staged present → retry-complete
  - `swap-in-progress` + staged gone, backup present → rollback
  - `committed` → cleanup only, zero copies
  - Legacy marker (no seq/state/backup path) → synthesised staged
  - Malformed marker → safely deleted

## Related

- [[Crypto Migration v5]]
- [[Data Recovery Guide]]
- [[Database Architecture]]
- [[Security Index]]
- [[Safety and Security]]
- [[Data Safety]]
