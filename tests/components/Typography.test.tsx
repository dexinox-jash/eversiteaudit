import React from 'react';
import { render, screen } from '@testing-library/react-native';
import type { TextStyle } from 'react-native';
import { Typography } from '@components/Typography';

function flattenStyle(style: unknown): TextStyle {
  if (Array.isArray(style)) {
    return (style as unknown[])
      .flat(Infinity as never)
      .reduce<TextStyle>((acc, s) => Object.assign(acc, s as TextStyle), {});
  }
  return (style ?? {}) as TextStyle;
}

describe('Typography', () => {
  it('renders children as text', () => {
    render(<Typography>Hello</Typography>);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('applies headingLg variant styles', () => {
    render(<Typography variant="headingLg">Heading</Typography>);
    const flat = flattenStyle(screen.getByText('Heading').props.style);
    expect(flat.fontWeight).toBe('500');
  });

  it('applies alignment', () => {
    render(<Typography align="center">Centered</Typography>);
    const flat = flattenStyle(screen.getByText('Centered').props.style);
    expect(flat.textAlign).toBe('center');
  });

  it('resolves color tokens', () => {
    render(<Typography color="secondary">Secondary</Typography>);
    const flat = flattenStyle(screen.getByText('Secondary').props.style);
    expect(typeof flat.color).toBe('string');
    expect((flat.color as string).length).toBeGreaterThan(0);
  });

  it('passes raw color when not a token', () => {
    render(<Typography color="#FF0000">Raw</Typography>);
    const flat = flattenStyle(screen.getByText('Raw').props.style);
    expect(flat.color).toBe('#FF0000');
  });

  it('supports weight override', () => {
    render(<Typography weight="bold">Bold</Typography>);
    const flat = flattenStyle(screen.getByText('Bold').props.style);
    expect(flat.fontWeight).toBe('700');
  });
});
