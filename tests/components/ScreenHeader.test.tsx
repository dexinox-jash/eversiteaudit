import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ScreenHeader } from '@components/ScreenHeader';

describe('ScreenHeader', () => {
  it('renders the title', () => {
    render(<ScreenHeader title="Issues" />);
    expect(screen.getByText('Issues')).toBeTruthy();
  });

  it('renders search input when searchProps provided', () => {
    render(
      <ScreenHeader
        title="Issues"
        searchProps={{ placeholder: 'Search issues', value: '', onChangeText: jest.fn() }}
      />
    );
    expect(screen.getByPlaceholderText('Search issues')).toBeTruthy();
  });

  it('renders filter chips and calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <ScreenHeader
        title="Issues"
        filterChips={[
          { label: 'Open', active: true, onPress },
          { label: 'Closed', active: false, onPress: jest.fn() },
        ]}
      />
    );

    expect(screen.getByText('Open')).toBeTruthy();
    expect(screen.getByText('Closed')).toBeTruthy();

    fireEvent.press(screen.getByText('Open'));
    expect(onPress).toHaveBeenCalled();
  });

  it('renders rightElement when provided', () => {
    render(<ScreenHeader title="Issues" rightElement={<Text testID="right-el">Right</Text>} />);
    expect(screen.getByTestId('right-el')).toBeTruthy();
  });

  it('does not render filter chip list when empty', () => {
    render(<ScreenHeader title="Issues" filterChips={[]} />);
    expect(screen.queryByRole('tablist')).toBeNull();
  });
});
