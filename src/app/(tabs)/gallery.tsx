import React, { useEffect } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen, EmptyState, FAB } from '@components/index';
import { Image as ImageIcon, Camera } from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import { usePhotoStore } from '@store/usePhotoStore';
import { spacing, touchTargets } from '@theme/index';
import type { Photo } from '@/types/domain';

function PhotoGridItem({ photo: _photo }: { photo: Photo }): JSX.Element {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.gridItem,
        { backgroundColor: colors.backgroundTertiary },
      ]}
    >
      <ImageIcon size={24} color={colors.textTertiary} />
    </View>
  );
}

export default function GalleryScreen(): JSX.Element {
  const { photos, loadPhotos } = usePhotoStore();

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  const handleTakePhoto = React.useCallback((): void => {
    router.push('/camera');
  }, []);

  return (
    <Screen scrollable={false} header={{ title: 'Gallery' }} pad>
      <FlatList
        data={photos}
        numColumns={3}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PhotoGridItem photo={item} />}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon={ImageIcon}
            title="No photos yet"
            subtitle="Capture photos to see them here."
            actionTitle="Take Photo"
            onAction={handleTakePhoto}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      <FAB
        icon={Camera}
        onPress={handleTakePhoto}
        accessibilityLabel="Take photo"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: 2,
    paddingBottom: spacing['5'] + touchTargets.preferred + spacing['5'],
  },
  columnWrapper: {
    gap: 2,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
});
