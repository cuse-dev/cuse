import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Page from '../app/page';

test('Home Page', () => {
  render(<Page />);
  expect(screen.getByText('Home')).toBeDefined();
});
