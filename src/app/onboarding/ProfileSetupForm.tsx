import React from 'react';
import { View, StyleSheet } from 'react-native';
import { User, Building2 } from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography, TextInput } from '@components/index';
import { spacing } from '@theme/index';

type ProfileSetupFormProps = {
  inspectorName: string;
  inspectorCompany: string;
  onNameChange: (name: string) => void;
  onCompanyChange: (company: string) => void;
};

export default function ProfileSetupForm({
  inspectorName,
  inspectorCompany,
  onNameChange,
  onCompanyChange,
}: ProfileSetupFormProps): JSX.Element {
  const { colors } = useTheme();

  return (
    <View style={styles.profileSection}>
      <View style={[styles.iconCircle, { backgroundColor: colors.backgroundTertiary }]}>
        <User size={48} color={colors.primary} />
      </View>
      <Typography
        variant="headingMd"
        accessibilityRole="header"
        color="primary"
        style={styles.title}
      >
        Set Up Your Profile
      </Typography>
      <Typography variant="body" color="secondary" style={styles.description}>
        This information will be used on your inspection reports.
      </Typography>
      <View style={styles.inputGroup}>
        <TextInput
          label="Inspector Name"
          placeholder="e.g. John Smith"
          value={inspectorName}
          onChangeText={onNameChange}
          icon={User}
          accessibilityLabel="Inspector name"
        />
        <TextInput
          label="Company Name"
          placeholder="e.g. Smith Inspections Ltd"
          value={inspectorCompany}
          onChangeText={onCompanyChange}
          icon={Building2}
          accessibilityLabel="Company name"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['6'],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['6'],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing['3'],
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
  },
  inputGroup: {
    width: '100%',
    gap: spacing['4'],
    marginTop: spacing['6'],
  },
});
