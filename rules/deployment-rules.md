# Deployment Rules

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. Expo SDK 52 Lock

The project is pinned to **Expo SDK 52** and **React Native 0.76**. These versions are immutable without an explicit SDK upgrade plan.

Critical packages with exact versions:
```json
{
  "expo": "52.0.49",
  "jest-expo": "52.0.6",
  "react-native": "0.76.0",
  "react": "18.3.1"
}
```

## 2. npm Defense System

Three layers protect against accidental dependency corruption:

### Layer 1: `.npmrc`
```ini
legacy-peer-deps=true
audit=false
fund=false
```

### Layer 2: `package.json` overrides
```json
"overrides": {
  "expo": "52.0.49",
  "jest-expo": "52.0.6",
  "ajv": "^8.18.0",
  "eslint": { "ajv": "^6.12.4" }
}
```

### Layer 3: `postinstall` script
```json
"postinstall": "echo 'INFO: Dependencies installed...'"
```

## 3. Forbidden Commands

| Command | Why Forbidden |
|---------|---------------|
| `npm audit fix --force` | Upgrades `expo`/`jest-expo` to SDK 55, breaking RN 0.76 compatibility |
| `npm update` without review | May bump transitive dependencies past tested ranges |
| `npm install <package>@latest` | Must verify SDK 52 compatibility first |

## 4. Expo Go Compatibility

Expo Go version must match the project's SDK version. If Expo Go is newer:
- Download the SDK 52 build from https://expo.dev/go
- Do NOT upgrade the project to match Expo Go.

## 5. Clean Install Procedure

```bash
# If dependency tree is suspect:
rm -rf node_modules package-lock.json
npm install        # No flags needed — .npmrc handles legacy-peer-deps
npm run verify     # Must pass before proceeding
```
