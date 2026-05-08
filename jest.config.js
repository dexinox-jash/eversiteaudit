module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((react-native|@react-native|expo|@expo|expo-.*|expo-modules-core|react-native-screens|react-native-safe-area-context|react-native-reanimated|heroui-native|uniwind|tailwindcss|@tailwindcss|tailwind-variants|tailwind-merge|lucide-react-native|@noble)/.*))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^react-native/Libraries/Utilities/Platform$':
      'react-native/Libraries/Utilities/Platform.ios.js',
  },
  modulePathIgnorePatterns: ['<rootDir>/.skills/'],
  testPathIgnorePatterns: ['/node_modules/', '/.skills/'],
  haste: {
    defaultPlatform: 'ios',
    platforms: ['ios', 'android', 'native'],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/_layout.tsx',
    '!src/app/index.tsx',
  ],
  coverageThreshold: {
    global: {
      // Temporarily lowered from 70 → 60 in Batch 1. Batch 2 (Coverage Gate
      // Restoration) raises this back to 70 after expanding coverage on
      // annotate/[id].tsx, photos/[id].tsx, projects/[id].tsx, and the
      // export/repository services. Do not relax below 60.
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
