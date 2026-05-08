import React, { forwardRef, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  type ViewToken,
  type ListRenderItem,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography } from '@components/index';
import { spacing } from '@theme/index';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type OnboardingPage = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

type OnboardingCarouselProps = {
  pages: OnboardingPage[];
  pageIndex: number;
  onPageIndexChange: (index: number) => void;
  onScrollToIndexFailed: (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => void;
};

const OnboardingCarousel = forwardRef<FlatList<OnboardingPage>, OnboardingCarouselProps>(
  function OnboardingCarousel({ pages, pageIndex, onPageIndexChange, onScrollToIndexFailed }, ref) {
    const { colors } = useTheme();

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        onPageIndexChange(viewableItems[0].index);
      }
    }).current;

    const renderPage: ListRenderItem<OnboardingPage> = useCallback(
      ({ item }) => {
        const Icon = item.icon;
        return (
          <View style={[styles.page, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.backgroundTertiary }]}>
              <Icon size={48} color={colors.primary} />
            </View>
            <Typography
              variant="headingMd"
              accessibilityRole="header"
              color="primary"
              style={styles.title}
            >
              {item.title}
            </Typography>
            <Typography variant="body" color="secondary" style={styles.description}>
              {item.description}
            </Typography>
          </View>
        );
      },
      [colors]
    );

    return (
      <>
        <FlatList
          ref={ref}
          data={pages}
          keyExtractor={(item) => item.key}
          renderItem={renderPage}
          horizontal
          pagingEnabled
          scrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          onScrollToIndexFailed={onScrollToIndexFailed}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />
        <View style={styles.dots}>
          {pages.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === pageIndex ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>
      </>
    );
  }
);

const styles = StyleSheet.create({
  page: {
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
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing['2'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default OnboardingCarousel;
