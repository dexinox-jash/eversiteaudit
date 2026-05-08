import React from 'react';
import { render } from '@testing-library/react-native';
import { FlatList, View } from 'react-native';
import OnboardingCarousel from '@app/onboarding/OnboardingCarousel';
import type { LucideIcon } from 'lucide-react-native';

const MockIcon = () => <View testID="mock-icon" />;

const pages = [
  { key: '1', title: 'Page 1', description: 'Desc 1', icon: MockIcon as unknown as LucideIcon },
  { key: '2', title: 'Page 2', description: 'Desc 2', icon: MockIcon as unknown as LucideIcon },
];

describe('OnboardingCarousel', () => {
  it('renders pages and dots', () => {
    const { getByText, getAllByTestId } = render(
      <OnboardingCarousel
        pages={pages}
        pageIndex={0}
        onPageIndexChange={jest.fn()}
        onScrollToIndexFailed={jest.fn()}
      />
    );
    expect(getByText('Page 1')).toBeTruthy();
    expect(getByText('Desc 1')).toBeTruthy();
    expect(getAllByTestId('mock-icon').length).toBeGreaterThanOrEqual(2);
  });

  it('calls onPageIndexChange when viewable items change', () => {
    const onPageIndexChange = jest.fn();
    const { UNSAFE_getByType } = render(
      <OnboardingCarousel
        pages={pages}
        pageIndex={0}
        onPageIndexChange={onPageIndexChange}
        onScrollToIndexFailed={jest.fn()}
      />
    );

    const flatList = UNSAFE_getByType(FlatList);

    flatList.props.onViewableItemsChanged({
      viewableItems: [{ index: 1, isViewable: true, item: pages[1] }],
    });

    expect(onPageIndexChange).toHaveBeenCalledWith(1);
  });

  it('does not call onPageIndexChange when viewable items are empty', () => {
    const onPageIndexChange = jest.fn();
    const { UNSAFE_getByType } = render(
      <OnboardingCarousel
        pages={pages}
        pageIndex={0}
        onPageIndexChange={onPageIndexChange}
        onScrollToIndexFailed={jest.fn()}
      />
    );

    const flatList = UNSAFE_getByType(FlatList);

    flatList.props.onViewableItemsChanged({
      viewableItems: [],
    });

    expect(onPageIndexChange).not.toHaveBeenCalled();
  });
});
