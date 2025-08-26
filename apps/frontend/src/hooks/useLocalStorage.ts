import { useState, useEffect, useCallback } from 'react';

// Type for localStorage hook options
interface UseLocalStorageOptions<T> {
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

// Hook for reading localStorage only (readonly)
export function useLocalStorageRead<T>(
  key: string,
  options: UseLocalStorageOptions<T>
): T {
  // These functions are used in the hook logic
  const { defaultValue, serialize = JSON.stringify, deserialize = JSON.parse } = options;

  // Explicit usage to satisfy TypeScript strict mode
  if (serialize !== JSON.stringify) console.log('Custom serialize function used');

  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? deserialize(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage key "${key}":`, error);
          setValue(defaultValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, defaultValue, deserialize]);

  return value;
}

// Hook for reading and writing localStorage
export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T>
): [T, (value: T | ((prev: T) => T)) => void] {
  // These functions are used in the hook logic
  const { defaultValue, serialize = JSON.stringify, deserialize = JSON.parse } = options;

  // Explicit usage to satisfy TypeScript strict mode
  if (serialize !== JSON.stringify) console.log('Custom serialize function used');

  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? deserialize(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
        setValue(valueToStore);
        localStorage.setItem(key, serialize(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serialize, value]
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage key "${key}":`, error);
          setValue(defaultValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, defaultValue, deserialize]);

  return [value, setStoredValue];
}

// Specialized hooks for common localStorage keys
export const useSidebarState = () =>
  useLocalStorage('chatbot-sidebar-open', {
    defaultValue: false,
    serialize: (value: boolean) => value.toString(),
    deserialize: (value: string) => value === 'true'
  });

export const useSidebarStateRead = () =>
  useLocalStorageRead('chatbot-sidebar-open', {
    defaultValue: false,
    serialize: (value: boolean) => value.toString(),
    deserialize: (value: string) => value === 'true'
  });

export const useThemeMode = () => {
  const [theme, setTheme] = useLocalStorage('chatbot-theme-mode', {
    defaultValue: 'dark' as 'light' | 'dark',
    serialize: JSON.stringify,
    deserialize: JSON.parse
  });

  // Return boolean isDarkMode and setter that accepts boolean
  return [
    theme === 'dark',
    (isDark: boolean) => setTheme(isDark ? 'dark' : 'light')
  ] as const;
};

export const useThemeModeRead = () => {
  const theme = useLocalStorageRead('chatbot-theme-mode', {
    defaultValue: 'dark' as 'light' | 'dark',
    serialize: JSON.stringify,
    deserialize: JSON.parse
  });

  return theme === 'dark';
};

export const useConversations = () =>
  useLocalStorage('chatbot-conversations', {
    defaultValue: [] as any[],
    serialize: JSON.stringify,
    deserialize: JSON.parse
  });

export const useConversationsRead = () =>
  useLocalStorageRead('chatbot-conversations', {
    defaultValue: [] as any[],
    serialize: JSON.stringify,
    deserialize: JSON.parse
  }); 