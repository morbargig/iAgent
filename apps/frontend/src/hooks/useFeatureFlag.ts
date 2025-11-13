import { environment } from '../environments/environment';

type FeatureFlagKey = keyof typeof environment.features;

export const useFeatureFlag = (feature: FeatureFlagKey): boolean => {
  return environment.features[feature] ?? false;
};

