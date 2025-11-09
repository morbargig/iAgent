import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './app/app';
import { TranslationProvider } from './contexts/TranslationContext';
import { queryClient } from './lib/queryClient';
import { enablePersistence } from './lib/persist';
import './styles.css';
import { useAppReadLocalStorage } from './hooks/storage';

// Restore document direction immediately on page load
const restoreDirection = () => {
  const storedDirection = localStorage.getItem('preferred_direction');
  const storedLang = localStorage.getItem('preferred_language');
  
  if (storedDirection && storedLang) {
    document.documentElement.dir = storedDirection;
    document.documentElement.lang = storedLang;
  }
};

// Apply direction before React renders
restoreDirection();

enablePersistence();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);


root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TranslationProvider>
      {import.meta.env.MODE !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>
);
