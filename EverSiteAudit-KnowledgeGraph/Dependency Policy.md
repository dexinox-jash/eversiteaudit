---
type: governance
source: DEPENDENCY_POLICY.md
parent: [[EverSiteAudit Master Governance]]
---

# Dependency Policy

## ⚠️ CRITICAL: Never run `npm audit fix --force`

`npm audit fix --force` is **dangerous** for Expo projects. It does not understand React Native / Expo SDK compatibility and will upgrade `expo` and `jest-expo` to versions requiring a newer React Native engine.

### What happened before

Running `npm audit fix --force` upgraded:
- `expo` to `^55.0.15` (requires RN 0.79+)
- `jest-expo` to `^55.0.16` (requires RN 0.79+)

while this project is locked to:
- `react-native@0.76.0`
- `expo@~52.0.0`

This completely broke `npm install`, Metro bundler, and all tests.

### Why audit warnings are acceptable

Reported vulnerabilities are almost entirely inside **transitive development dependencies** of `jest-expo` (old `jest@27` internals, `glob`, `semver`, `xml2js`, etc.). These run only during Jest tests in a local, controlled environment. They do not ship to end-user devices.

### Safe commands

```bash
npm install
npm run verify
npx expo start
```

### NEVER run this

```bash
npm audit fix --force
```

### `.npmrc`

```ini
legacy-peer-deps=true
audit=false
fund=false
```

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Deployment Rules]]
- [[Android Run Guide]]
