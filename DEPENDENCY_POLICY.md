# Dependency Policy — EverSiteAudit

## ⚠️ CRITICAL: Never run `npm audit fix --force`

`npm audit fix --force` is **dangerous** for Expo projects. It does not understand React Native / Expo SDK compatibility and will happily upgrade `expo` and `jest-expo` to versions that require a newer React Native engine than the one installed.

### What happened before
Running `npm audit fix --force` upgraded:
- `expo` to `^55.0.15` (requires RN 0.79+)
- `jest-expo` to `^55.0.16` (requires RN 0.79+)

while this project is locked to:
- `react-native@0.76.0`
- `expo@~52.0.0`

This completely broke `npm install`, the Metro bundler, and all tests.

### Why the audit warnings are acceptable
The reported vulnerabilities are almost entirely inside **transitive development dependencies** of `jest-expo` (old `jest@27` internals, `glob`, `semver`, `xml2js`, etc.). These packages run only during Jest tests in a local, controlled environment. They do not ship to end-user devices and do not expose attack surfaces in production.

### Safe commands
```bash
# Always safe
npm install
npm run verify
npx expo start

# NEVER run this
npm audit fix --force
```

### If you must address audit warnings
Do it manually by researching whether a patched version exists within the same Expo SDK major version, or wait for Expo to release an updated `jest-expo` patch for SDK 52.

### .npmrc
This project includes `.npmrc` with `legacy-peer-deps=true` so that `npm install` succeeds cleanly without manual flags.
