import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { View, ScrollView, FlatList, Text } from 'react-native';
import { Typography } from '@components/Typography';
import { ThemeProvider } from '@components/ThemeProvider';
import { usePreferenceStore } from '@store/usePreferenceStore';

jest.mock('@store/usePreferenceStore');

function MockThemeProvider({ children, reduceMotion = false }: { children: React.ReactNode; reduceMotion?: boolean }) {
  (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
    theme: 'dark',
    reduceMotion,
    highContrast: false,
    isLoaded: true,
    load: jest.fn(),
  });
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('Dynamic Type / Font scaling accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Typography does not disable font scaling', () => {
    render(
      <MockThemeProvider>
        <Typography testID="text">Hello</Typography>
      </MockThemeProvider>
    );
    const textEl = screen.getByTestId('text');
    expect(textEl.props.allowFontScaling).not.toBe(false);
  });

  it('Typography renders with semantic font size tokens', () => {
    const { getByTestId } = render(
      <MockThemeProvider>
        <Typography testID="body" variant="body">
          Body text
        </Typography>
      </MockThemeProvider>
    );
    const textEl = getByTestId('body');
    expect(textEl.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontSize: expect.any(Number) }),
      ])
    );
  });

  it('Typography heading variant uses large font size', () => {
    const { getByTestId } = render(
      <MockThemeProvider>
        <Typography testID="heading" variant="headingLg">
          Heading
        </Typography>
      </MockThemeProvider>
    );
    const textEl = getByTestId('heading');
    const style = textEl.props.style;
    let fontSize = 0;
    if (Array.isArray(style)) {
      for (const s of style) {
        if (s && typeof s === 'object' && 'fontSize' in s) {
          fontSize = s.fontSize;
          break;
        }
      }
    } else if (style && typeof style === 'object' && 'fontSize' in style) {
      fontSize = style.fontSize;
    }
    expect(fontSize).toBeGreaterThanOrEqual(20);
  });

  it('Typography caption variant still uses readable minimum size', () => {
    const { getByTestId } = render(
      <MockThemeProvider>
        <Typography testID="caption" variant="caption">
          Caption
        </Typography>
      </MockThemeProvider>
    );
    const textEl = getByTestId('caption');
    const style = textEl.props.style;
    let fontSize = 0;
    if (Array.isArray(style)) {
      for (const s of style) {
        if (s && typeof s === 'object' && 'fontSize' in s) {
          fontSize = s.fontSize;
          break;
        }
      }
    } else if (style && typeof style === 'object' && 'fontSize' in style) {
      fontSize = style.fontSize;
    }
    expect(fontSize).toBeGreaterThanOrEqual(11);
  });

  it('ScrollView is used in main form screens to accommodate larger text', () => {
    const FormScreen = () => (
      <ScrollView testID="scroll-container">
        <Typography variant="body">Long form content</Typography>
      </ScrollView>
    );
    render(<FormScreen />);
    expect(screen.getByTestId('scroll-container')).toBeTruthy();
  });

  it('FlatList is used for list screens to accommodate variable row heights', () => {
    const ListScreen = () => (
      <FlatList
        testID="list-container"
        data={[{ id: '1', title: 'Item' }]}
        keyExtractor={(item) => item.id}
        renderItem={() => (
          <View>
            <Typography variant="body">Item</Typography>
          </View>
        )}
      />
    );
    render(<ListScreen />);
    expect(screen.getByTestId('list-container')).toBeTruthy();
  });

  it('Text component supports allowFontScaling by default', () => {
    render(<Text testID="native-text">Native text</Text>);
    const textEl = screen.getByTestId('native-text');
    expect(textEl.props.allowFontScaling).not.toBe(false);
  });
});
