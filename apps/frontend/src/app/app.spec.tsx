import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TranslationProvider } from '../contexts/TranslationContext';

import App from './app';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <TranslationProvider>
      {children}
    </TranslationProvider>
  </BrowserRouter>
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
