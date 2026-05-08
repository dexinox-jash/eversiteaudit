---
type: analysis
severity: architectural-friction
---

# Empty API Sync Directories

## Finding

Two directories in `src/services/` exist but contain **zero files**:
- `src/services/api/`
- `src/services/sync/`

## Evidence

```
src/services/
├── api/          ← empty
├── backup/
├── db/
├── export/
├── os/
├── security/
├── storage/
└── sync/         ← empty
```

## Interpretation

These directories indicate **planned but unimplemented features**:
- `api/` — Likely intended for REST/GraphQL client, backend integration
- `sync/` — Likely intended for cloud synchronization engine

Both are architecturally incompatible with the project's **offline-first, zero-network** philosophy documented in `master.md` and `safety/security-protocols.md`.

## Impact

- **Directory clutter:** Empty directories add noise to the codebase
- **Confusion for new developers:** May appear as missing implementation
- **Contradiction with privacy guarantees:** Cloud sync is explicitly forbidden

## Recommendation

1. Remove empty directories to reduce confusion
2. OR add a `README.md` in each explaining they are intentionally unused per privacy policy
3. Update `architecture-rules.md` file organization diagram to exclude them

## Related

- [[Architecture Index]]
- [[Architecture Rules]]
- [[Privacy Guarantees]]
- [[Security Protocols]]
