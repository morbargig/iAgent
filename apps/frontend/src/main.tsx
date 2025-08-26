import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { TranslationProvider } from './contexts/TranslationContext';
import './styles.css';

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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <TranslationProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TranslationProvider>
  </StrictMode>
);
