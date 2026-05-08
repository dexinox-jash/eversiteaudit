import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatBadge } from '@components/StatBadge';

describe('StatBadge', () => {
  it('renders severity badge — critical', () => {
    render(<StatBadge type="severity" value="critical" />);
    expect(screen.getByText('critical')).toBeTruthy();
  });

  it('renders severity badge — high', () => {
    render(<StatBadge type="severity" value="high" />);
    expect(screen.getByText('high')).toBeTruthy();
  });

  it('renders severity badge — medium', () => {
    render(<StatBadge type="severity" value="medium" />);
    expect(screen.getByText('medium')).toBeTruthy();
  });

  it('renders severity badge — low', () => {
    render(<StatBadge type="severity" value="low" />);
    expect(screen.getByText('low')).toBeTruthy();
  });

  it('renders severity badge — unknown falls back to default', () => {
    render(<StatBadge type="severity" value="unknown" />);
    expect(screen.getByText('unknown')).toBeTruthy();
  });

  it('renders status badge for open', () => {
    render(<StatBadge type="status" value="open" />);
    expect(screen.getByText('open')).toBeTruthy();
  });

  it('renders status badge for in_progress', () => {
    render(<StatBadge type="status" value="in_progress" />);
    expect(screen.getByText('in_progress')).toBeTruthy();
  });

  it('renders status badge for resolved', () => {
    render(<StatBadge type="status" value="resolved" />);
    expect(screen.getByText('resolved')).toBeTruthy();
  });

  it('renders status badge for closed', () => {
    render(<StatBadge type="status" value="closed" />);
    expect(screen.getByText('closed')).toBeTruthy();
  });

  it('renders status badge for active', () => {
    render(<StatBadge type="status" value="active" />);
    expect(screen.getByText('active')).toBeTruthy();
  });

  it('renders status badge for completed', () => {
    render(<StatBadge type="status" value="completed" />);
    expect(screen.getByText('completed')).toBeTruthy();
  });

  it('renders status badge for archived', () => {
    render(<StatBadge type="status" value="archived" />);
    expect(screen.getByText('archived')).toBeTruthy();
  });

  it('renders status badge — unknown falls back to default', () => {
    render(<StatBadge type="status" value="unknown" />);
    expect(screen.getByText('unknown')).toBeTruthy();
  });

  it('renders count badge', () => {
    render(<StatBadge type="count" value="12" />);
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('renders priority badge — critical (3)', () => {
    render(<StatBadge type="priority" value="3" />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('renders priority badge — high (2)', () => {
    render(<StatBadge type="priority" value="2" />);
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders priority badge — medium (1)', () => {
    render(<StatBadge type="priority" value="1" />);
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('renders priority badge — low (0)', () => {
    render(<StatBadge type="priority" value="0" />);
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('renders priority badge — unknown falls back to default', () => {
    render(<StatBadge type="priority" value="99" />);
    expect(screen.getByText('99')).toBeTruthy();
  });

  it('renders with small size by default', () => {
    render(<StatBadge type="severity" value="high" />);
    expect(screen.getByText('high')).toBeTruthy();
  });

  it('renders with default size when specified', () => {
    render(<StatBadge type="severity" value="high" size="default" />);
    expect(screen.getByText('high')).toBeTruthy();
  });
});
