import React from 'react';
import { render } from '@testing-library/react-native';
import { Divider } from '@components/Divider';

describe('Divider', () => {
  it('renders', () => {
    const tree = render(<Divider />).toJSON();
    expect(tree).toBeTruthy();
  });

  it('renders with custom spacing', () => {
    const tree = render(<Divider spacing={8} />).toJSON();
    expect(tree).toBeTruthy();
  });
});
