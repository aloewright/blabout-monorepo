import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders agent dashboard', () => {
  render(<App />);
  const linkElement = screen.getByText(/Agent Dashboard/i);
  expect(linkElement).toBeInTheDocument();
});
