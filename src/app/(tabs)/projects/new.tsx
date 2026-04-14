import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Screen, TextInput, Button, Typography } from '@components/index';
import { useTheme } from '@components/ThemeProvider';
import { useProjectStore } from '@store/useProjectStore';
import { spacing } from '@theme/index';

export default function NewProjectScreen(): JSX.Element {
  const { colors } = useTheme();
  const { createProject, error: storeError, clearError } = useProjectStore();

  const [name, setName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = (): void => {
    clearError();
    router.back();
  };

  const validate = (): boolean => {
    if (!name.trim()) {
      setNameError('Project name is required');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      await createProject({
        name: name.trim(),
        siteAddress: siteAddress.trim() || null,
        clientName: clientName.trim() || null,
        description: description.trim() || null,
      });
      router.back();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      header={{
        title: 'New Project',
        leftIcon: ArrowLeft,
        onLeftPress: handleBack,
      }}
    >
      <View style={styles.form}>
        <View style={styles.fields}>
          <TextInput
            label="Project Name"
            placeholder="Enter project name"
            value={name}
            onChangeText={setName}
            autoFocus
            error={nameError || undefined}
            editable={!isSubmitting}
          />
          <TextInput
            label="Site Address"
            placeholder="Enter site address"
            value={siteAddress}
            onChangeText={setSiteAddress}
            editable={!isSubmitting}
          />
          <TextInput
            label="Client Name"
            placeholder="Enter client name"
            value={clientName}
            onChangeText={setClientName}
            editable={!isSubmitting}
          />
          <TextInput
            label="Description"
            placeholder="Enter description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.descriptionInput}
            editable={!isSubmitting}
          />
        </View>

        {storeError ? (
          <Typography variant="bodySmall" color={colors.error} style={styles.errorText}>
            {storeError}
          </Typography>
        ) : null}

        <Button
          title="Create Project"
          onPress={() => void handleSubmit()}
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>

      {isSubmitting ? (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
    gap: spacing['6'],
  },
  fields: {
    gap: spacing['4'],
  },
  descriptionInput: {
    minHeight: 100,
  },
  errorText: {
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
