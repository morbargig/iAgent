import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { TranslationProvider } from '../contexts/TranslationContext';
import { queryClient } from '../lib/queryClient';

import App from './app';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TranslationProvider>
        <AuthProvider>{children}</AuthProvider>
      </TranslationProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should render the mock mode interface', () => {
    const { getByText } = render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    // Look for text that actually exists in the interface
    expect(getByText('Mock Mode')).toBeTruthy();
    expect(getByText('Using Mock Backend')).toBeTruthy();
  });
});
