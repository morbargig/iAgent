import { useAppLocalStorage } from './storage';

export const useMockMode = () => {
  const [appSettings, setAppSettings] = useAppLocalStorage('app-settings');
  const useMockMode = appSettings.mockMode;

  const toggleMockMode = () => {
    setAppSettings((prev) => ({
      ...prev,
      mockMode: !prev.mockMode,
    }));
  };

  const setMockMode = (enabled: boolean) => {
    setAppSettings((prev) => ({
      ...prev,
      mockMode: enabled,
    }));
  };

  return {
    useMockMode,
    toggleMockMode,
    setMockMode,
  };
};
