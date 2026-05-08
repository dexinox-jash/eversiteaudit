import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography, Button, SkeletonList } from '@components/index';
import { spacing } from '@theme/index';
import type { Template } from '@/types/domain';

type TemplateSelectorProps = {
  templates: Template[];
  selectedTemplateId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
};

export default function TemplateSelector({
  templates,
  selectedTemplateId,
  isLoading,
  onSelect,
}: TemplateSelectorProps): JSX.Element {
  const { colors } = useTheme();

  return (
    <View style={styles.templateSection}>
      <Typography
        variant="headingSm"
        accessibilityRole="header"
        color="primary"
        style={styles.templateTitle}
      >
        Choose a Starting Template
      </Typography>
      {isLoading ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing['4'] }}>
          <SkeletonList count={1} lines={1} />
        </View>
      ) : (
        <View
          style={styles.templateList}
          accessibilityRole="radiogroup"
          accessibilityLabel="Starting templates"
        >
          {templates.map((t) => {
            const selected = selectedTemplateId === t.id;
            return (
              <Button
                key={t.id}
                title={t.name}
                variant={selected ? 'primary' : 'secondary'}
                size="small"
                onPress={() => {
                  onSelect(t.id);
                }}
                style={[
                  styles.templateChip,
                  !selected && { borderColor: colors.border },
                  selected && {
                    borderWidth: 2,
                    borderColor: colors.primary,
                  },
                ]}
                accessibilityLabel={`Select template ${t.name}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              />
            );
          })}
        </View>
      )}
      {templates.length > 0 && selectedTemplateId ? (
        <Typography variant="caption" color="secondary" style={styles.templateDescription}>
          {templates.find((t) => t.id === selectedTemplateId)?.description ?? ''}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  templateSection: {
    marginBottom: spacing['4'],
    paddingHorizontal: spacing['4'],
    flex: 1,
    justifyContent: 'center',
  },
  templateTitle: {
    textAlign: 'center',
    marginBottom: spacing['3'],
  },
  templateList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing['2'],
  },
  templateChip: {
    minWidth: 120,
  },
  templateDescription: {
    textAlign: 'center',
    marginTop: spacing['3'],
    paddingHorizontal: spacing['4'],
  },
});
