---
type: analysis
severity: architectural-friction
---

# HeroUI Native Discrepancy

## Finding

Design documentation (`.documentation/ARCHITECTURE.md`, `.documentation/DESIGN.md`, `design/DESIGN.md`) lists `heroui-native` ^1.0.1 as a core dependency and the project's UI component library.

However, **zero HeroUI Native imports exist in production `src/` code**.

## Evidence

- `package.json` includes `heroui-native` as a dependency
- Peer-dependency warnings for `heroui-native` appear during `npm install`
- All UI components are **fully custom** built on React Native primitives
- `ANDROID_RUN_GUIDE.md` explicitly mentions ignoring `heroui-native` peer-dependency warnings

## Impact

- **Bundle bloat:** `heroui-native` is installed but unused, increasing node_modules size
- **Documentation drift:** Architecture and design docs do not reflect implementation reality
- **Dependency confusion:** New developers may attempt to use HeroUI components that aren't actually available

## Recommendation

1. Remove `heroui-native` from `package.json` dependencies
2. Update `.documentation/ARCHITECTURE.md` and `.documentation/DESIGN.md` to reflect the custom component library
3. Document the custom component catalog as the canonical UI reference

## Related

- [[Architecture Index]]
- [[UI Components Index]]
- [[Architecture Specification]]
- [[Design Specification]]
