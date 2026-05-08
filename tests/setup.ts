import '@testing-library/react-native';

// Global test setup and mocks for React Native / Expo
jest.useFakeTimers();

// Polyfill crypto.randomUUID for Jest environment
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  Object.defineProperty(crypto, 'randomUUID', {
    value: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).slice(2)),
    writable: true,
    configurable: true,
  });
}

// Polyfill Web Crypto subtle for field encryption tests
if (typeof crypto !== 'undefined' && !crypto.subtle) {
  Object.defineProperty(crypto, 'subtle', {
    value: {
      encrypt: jest.fn(async () => new ArrayBuffer(8)),
      decrypt: jest.fn(async () => new ArrayBuffer(8)),
      importKey: jest.fn(async () => ({})),
    },
    writable: true,
    configurable: true,
  });
}

// Mock expo-router
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    useLocalSearchParams: jest.fn(),
    router: {
      back: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
    },
    Stack: Object.assign(
      jest.fn(({ children }: { children?: React.ReactNode }) =>
        React.createElement(View, null, children)
      ),
      { Screen: jest.fn(() => null) }
    ),
  };
});

// Mock ThemeProvider to avoid async preference loading in tests
jest.mock('@components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({
    theme: 'dark',
    themeSetting: 'dark',
    colors: {
      primary: '#4A9EFF',
      primaryHover: '#6BB3FF',
      primaryPressed: '#3A8EEF',
      primarySubtle: '#1A3A5C',
      success: '#06D6A0',
      warning: '#FFD166',
      error: '#FF4757',
      info: '#4A9EFF',
      background: '#0D1117',
      backgroundSecondary: '#161B22',
      backgroundTertiary: '#21262D',
      backgroundElevated: '#30363D',
      scrim: 'rgba(0,0,0,0.7)',
      textPrimary: '#F0F6FC',
      textSecondary: '#8B949E',
      textTertiary: '#6E7681',
      textDisabled: '#484F58',
      border: '#30363D',
      borderSubtle: '#21262D',
      severity: {
        critical: '#FF4757',
        high: '#FF8C42',
        medium: '#FFD166',
        low: '#06D6A0',
      },
      severityBackground: {
        critical: '#FF475720',
        high: '#FF8C4220',
        medium: '#FFD16620',
        low: '#06D6A020',
      },
      surfaceOverlay: 'rgba(255,255,255,0.03)',
    },
    reduceMotion: false,
    highContrast: false,
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock expo modules that require native code
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@services/security/fieldEncryption', () => ({
  encryptField: jest.fn(async (value: string | null | undefined) => value),
  decryptField: jest.fn(async (value: string | null | undefined) => value),
}));

jest.mock('@services/security/keyStore', () => ({
  getOrCreateEncryptionKey: jest.fn(async () => 'a'.repeat(64)),
  storeEncryptionKey: jest.fn(),
  clearEncryptionKey: jest.fn(),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(() => Promise.resolve([])),
    getAllSync: jest.fn(() => [
      { name: 'projects' },
      { name: 'issues' },
      { name: 'photos' },
      { name: 'annotations' },
      { name: 'templates' },
      { name: 'settings' },
      { name: 'export_history' },
    ]),
    getFirstAsync: jest.fn(),
    getFirstSync: jest.fn(() => ({ user_version: 5 })),
    withExclusiveTransactionAsync: jest.fn(async (cb: (db: unknown) => Promise<void>) =>
      cb({
        execSync: jest.fn(),
        runSync: jest.fn(),
        runAsync: jest.fn(),
        getAllAsync: jest.fn(() => Promise.resolve([])),
      })
    ),
    closeSync: jest.fn(),
  })),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/',
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve(undefined)),
  deleteAsync: jest.fn(() => Promise.resolve(undefined)),
  copyAsync: jest.fn(() => Promise.resolve(undefined)),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve(undefined)),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  getFreeDiskStorageAsync: jest.fn(() => Promise.resolve(1024 * 1024 * 1024)),
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
}));

jest.mock('expo-crypto', () => ({
  getRandomValues: jest.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  getRandomBytesAsync: jest.fn(async (length: number) => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }),
  digestStringAsync: jest.fn(async (_algo: string, input: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { BASE64: 'base64' },
}));

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file:///mock/test.pdf' })),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(() => Promise.resolve(undefined)),
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() =>
        Promise.resolve({
          sound: {
            playAsync: jest.fn(() => Promise.resolve()),
            pauseAsync: jest.fn(() => Promise.resolve()),
            unloadAsync: jest.fn(() => Promise.resolve()),
            getStatusAsync: jest.fn(() =>
              Promise.resolve({ isLoaded: true, durationMillis: 15000, positionMillis: 0 })
            ),
            setOnPlaybackStatusUpdate: jest.fn(),
          },
        })
      ),
    },
    Recording: {
      createAsync: jest.fn(() => Promise.resolve({ recording: {} })),
    },
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-camera', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const CameraView = React.forwardRef(
    (
      { children, style, testID }: { children?: React.ReactNode; style?: object; testID?: string },
      ref: React.Ref<unknown>
    ) => {
      React.useImperativeHandle(ref, () => ({
        takePictureAsync: jest.fn(() =>
          Promise.resolve({ uri: 'file:///mock/photo.jpg', width: 1920, height: 1080 })
        ),
      }));
      return React.createElement(View, { style, testID: testID ?? 'camera-view' }, children);
    }
  );
  CameraView.displayName = 'CameraView';
  return {
    CameraView,
    useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    Camera: {
      requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    },
  };
});
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Error: 'error',
    Warning: 'warning',
  },
}));

jest.mock('expo-quick-actions', () => ({
  isSupported: jest.fn(() => Promise.resolve(true)),
  setItems: jest.fn(() => Promise.resolve()),
  initial: undefined,
  addListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
    })
  ),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => Promise.resolve({ uri: 'file:///mock/manipulated.jpg' })),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

jest.mock('react-native-svg', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    Svg: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    Path: () => React.createElement(View, null),
    Circle: () => React.createElement(View, null),
    Rect: () => React.createElement(View, null),
    Line: () => React.createElement(View, null),
    Polyline: () => React.createElement(View, null),
    Polygon: () => React.createElement(View, null),
    Text: () => React.createElement(View, null),
    G: ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children),
    Defs: () => React.createElement(View, null),
    ClipPath: () => React.createElement(View, null),
    LinearGradient: () => React.createElement(View, null),
    Stop: () => React.createElement(View, null),
  };
});

jest.mock('@shopify/flash-list', () => {
  const React = jest.requireActual('react');
  const { FlatList } = jest.requireActual('react-native');
  const FlashListMock = React.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<unknown>) =>
      React.createElement(FlatList, { ref, ...props })
  );
  FlashListMock.displayName = 'FlashList';
  return { FlashList: FlashListMock };
});

jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    SafeAreaProvider: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: object }) =>
      React.createElement(View, { style }, children),
    useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
    useSafeAreaFrame: jest.fn(() => ({ width: 375, height: 812, x: 0, y: 0 })),
  };
});
