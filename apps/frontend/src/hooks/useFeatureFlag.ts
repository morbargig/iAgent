import { useEffect, useMemo, useRef, useCallback } from 'react';
import { environment } from '../environments/environment';
import { useAppLocalStorage } from './storage';

type FeatureFlagKey = keyof typeof environment.features;

const INIT_KEY = '__feature_flags_initialized__';

export const useFeatureFlag = (feature: FeatureFlagKey): boolean => {
  const [featureFlags, setFeatureFlags] = useAppLocalStorage('feature-flags');
  const initializedRef = useRef(false);
  const envValue = environment.features[feature] ?? false;

  useEffect(() => {
    if (!initializedRef.current) {
      const hasLocalStorageValue = localStorage.getItem('feature-flags') !== null;
      const wasInitialized = sessionStorage.getItem(INIT_KEY) === 'true';
      
      if (!hasLocalStorageValue && !wasInitialized) {
        setFeatureFlags(environment.features);
        sessionStorage.setItem(INIT_KEY, 'true');
      }
      
      initializedRef.current = true;
    }
  }, [setFeatureFlags]);

  return useMemo(() => {
    return featureFlags[feature] ?? envValue;
  }, [featureFlags, feature, envValue]);
};

export const useFeatureFlags = () => {
  const [featureFlags, setFeatureFlags, removeFeatureFlags] = useAppLocalStorage('feature-flags');

  const resetToEnvironment = useCallback(() => {
    setFeatureFlags(environment.features);
  }, [setFeatureFlags]);

  const resetToDefaults = useCallback(() => {
    removeFeatureFlags();
    setFeatureFlags(environment.features);
  }, [removeFeatureFlags, setFeatureFlags]);

  const setFeatureFlag = useCallback((feature: FeatureFlagKey, value: boolean) => {
    setFeatureFlags((prev) => ({
      ...prev,
      [feature]: value,
    }));
  }, [setFeatureFlags]);

  const toggleFeatureFlag = useCallback((feature: FeatureFlagKey) => {
    setFeatureFlags((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  }, [setFeatureFlags]);

  return {
    featureFlags,
    setFeatureFlags,
    removeFeatureFlags,
    resetToEnvironment,
    resetToDefaults,
    setFeatureFlag,
    toggleFeatureFlag,
  };
};

