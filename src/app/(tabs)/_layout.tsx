import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@components/ThemeProvider';
import { Folder, AlertCircle, Image as ImageIcon, Settings } from 'lucide-react-native';

/**
 * Main tab navigation layout.
 * Tabs: Projects | Issues | Gallery | Settings
 */
export default function TabLayout(): JSX.Element {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundSecondary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => <Folder size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="issues"
        options={{
          title: 'Issues',
          tabBarIcon: ({ color, size }) => <AlertCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color, size }) => <ImageIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
