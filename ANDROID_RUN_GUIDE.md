# Android Run Guide — EverSiteAudit

## Prerequisites

1. **Node.js 20 LTS** (e.g., `v20.18.1` or `v20.19.0`)
   - **Important:** Node 22+ and Node 25 are **not compatible** with this project's current `expo-modules-core@2.2.3` due to `require(esm)` and experimental TypeScript-stripping behavior.
   - Download from: https://nodejs.org/en/download/prebuilt-installer
   - Verify: `node --version`

2. **Android Device** with:
   - Android 8.0+ (API 26+)
   - USB Debugging enabled (`Settings > System > Developer options > USB debugging`)

3. **USB Cable** to connect your device to your computer.

4. **Expo Go app** installed from the Google Play Store (for quick testing).

5. **Android Studio** (optional, only if you want to build a native development build).

---

## Step 1: Install Dependencies

Open a terminal in the project root (`c:\Users\Dexinox\Documents\kimi code\EverSiteAudit`) and run:

```bash
npm install
```

> If you encounter peer-dependency warnings for `heroui-native`, you can safely ignore them or use `npm install --legacy-peer-deps`.

---

## Step 2: Verify the Project Builds

Run the verification gate to confirm everything is green before starting the dev server:

```bash
npm run verify
```

Expected output:
- TypeScript: 0 errors
- ESLint: 0 errors (23 warnings are pre-existing and safe to ignore)
- Jest: **63 suites passed, 452 tests passed**

---

## Step 3: Start the Development Server

### Option A — Run with Expo Go (Recommended for Quick Testing)

Start the Metro bundler:

```bash
npx expo start --clear
```

Wait for the QR code to appear in the terminal.

1. Make sure your Android device is on the **same Wi-Fi network** as your computer.
2. Open the **Expo Go** app on your Android device.
3. Tap **"Scan QR code"** and scan the code shown in your terminal.
4. The app will download the JavaScript bundle and launch.

### Option B — Run via USB (LAN Mode)

If your device and computer are on the same network but Wi-Fi is unreliable, use:

```bash
npx expo start --lan --clear
```

Then enter the URL shown in the terminal (e.g., `exp://192.168.x.x:8081`) manually into Expo Go.

### Option C — Run with a Native Development Build

If you need native modules that aren't available in Expo Go, build and run a development client:

```bash
npx expo run:android
```

This will:
1. Generate the Android native project (`android/`)
2. Compile the APK
3. Install it on your connected device
4. Launch the app

> **Note:** This requires Android Studio and a working Android SDK.

---

## Known Issues & Troubleshooting

### 1. `ERR_UNKNOWN_FILE_EXTENSION` for `.ts` files (Node 22+/25)
**Symptom:** `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts" for ... expo-modules-core/src/index.ts`

**Fix:** Downgrade to **Node 20 LTS**. This is a compatibility issue between newer Node versions and `expo-modules-core@2.2.3`.

---

### 2. `expo-asset` cannot be found
**Symptom:** `Error: The required package expo-asset cannot be found`

**Fix:** Install it at the root level:
```bash
npm install expo-asset
```

---

### 3. `expo-quick-actions` plugin validation error
**Symptom:** `Invalid options object. expo-quick-actions has been initialized using an options object that does not match the API schema.`

**Fix:** In `app.json`, ensure `expo-quick-actions` is listed as a plain string without options:
```json
"plugins": [
  "expo-router",
  "expo-quick-actions",
  "./plugins/backup-exclusion.js"
]
```

---

### 4. `expo-sharing` plugin error
**Symptom:** `Package "expo-sharing" does not contain a valid config plugin.`

**Fix:** Remove `"expo-sharing"` from the `plugins` array in `app.json`. `expo-sharing` is used in code only and does not provide a config plugin.

---

### 5. Ngrok tunnel fails
**Symptom:** `CommandError: TypeError: Cannot read properties of undefined (reading 'body')` when using `--tunnel`

**Cause:** `npx expo start --tunnel` uses Ngrok, which now requires a free authtoken.

**Workarounds:**
- Use `--lan` instead of `--tunnel` (same Wi-Fi network).
- Or use a free alternative tunnel like `localtunnel`:
  ```bash
  # Terminal 1
  npx expo start
  # Terminal 2
  npx localtunnel --port 8081
  ```
- Or sign up at https://ngrok.com, get an authtoken, and run:
  ```bash
  npx ngrok config add-authtoken <YOUR_TOKEN>
  npx expo start --tunnel
  ```

---

### 6. Metro bundle resolution errors
**Symptom:** `Unable to resolve module ./node_modules/expo-router/entry`

**Fix:** Clear the Metro cache and restart:
```bash
npx expo start --clear
```

Or manually delete the cache:
```bash
rd /s /q .expo
npx expo start --clear
```

---

## Quick Reference Commands

| Goal | Command |
|------|---------|
| Verify build | `npm run verify` |
| Start dev server | `npx expo start --clear` |
| Start on LAN | `npx expo start --lan --clear` |
| Android dev build | `npx expo run:android` |
| Clear Metro cache | `npx expo start --clear` |
| Run tests | `npm run test` |

---

## Verification Checklist

Before considering the Android run successful, confirm:
- [ ] `npm run verify` passes
- [ ] Metro bundler starts without errors
- [ ] The app launches on the Android device
- [ ] You can navigate through: Projects → Issues → Camera → Gallery → Export
- [ ] Camera permission is granted and photo capture works
- [ ] Settings screen loads and preferences persist
