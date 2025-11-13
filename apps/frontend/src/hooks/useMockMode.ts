import { useAppLocalStorage } from './storage';
import { useFeatureFlag } from './useFeatureFlag';

export const useMockMode = () => {
  const enableMockMode = useFeatureFlag('enableMockMode');
  const [appSettings, setAppSettings] = useAppLocalStorage('app-settings');
  const useMockMode = enableMockMode && appSettings.mockMode;

  const toggleMockMode = () => {
    if (!enableMockMode) return;
    setAppSettings((prev) => ({
      ...prev,
      mockMode: !prev.mockMode,
    }));
  };

  const setMockMode = (enabled: boolean) => {
    if (!enableMockMode) return;
    setAppSettings((prev) => ({
      ...prev,
      mockMode: enabled,
    }));
  };

  return {
    useMockMode,
    enableMockMode,
    toggleMockMode,
    setMockMode,
  };
};
