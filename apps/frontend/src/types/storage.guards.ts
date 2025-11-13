import {
  isType,
  isBoolean,
  isString,
  isArray,
  isIndexRecord,
  isOptional,
  isUnion,
  isLiteral,
  isUnknown,
  isNumber,
} from 'isguard-ts';
import type {
  LocalStorageValues,
  LocalStorageKeys,
  SessionStorageValues,
  SessionStorageKeys,
  ToolConfiguration,
  DateRangeSettings,
} from './storage.types';

export const isChatbotSidebarOpen = isBoolean;

export const isChatbotThemeMode = isBoolean;

export const isChatbotConversations = isArray(
  isType({
    id: isString,
    title: isOptional(isString),
    messages: isOptional(isArray(isUnknown)),
    createdAt: isOptional(isString),
    updatedAt: isOptional(isString),
  })
);

export const isToolConfiguration = isType({
  toolId: isString,
  enabled: isBoolean,
  parameters: isType({
    pages: isOptional(
      isType({
        selectedPages: isArray(isString),
        inclusionType: isOptional(isUnion(
          isLiteral('include'),
          isLiteral('include_only'),
          isLiteral('exclude')
        )),
      })
    ),
    requiredWords: isOptional(isArray(isString)),
  }),
});

export const isEnabledTools = isIndexRecord(isBoolean);

export const isToolConfigurations = isIndexRecord(isToolConfiguration);

export const isSelectedCountries = isArray(isString);

export const isAvailableCountries = isArray(
  isType({
    code: isString,
    flag: isString,
    nameKey: isString,
  })
);

export const isDateRangeSettings = isType({
  activeTab: isNumber,
  committedTab: isNumber,
  customRange: isType({
    amount: isNumber,
    type: isUnion(
      isLiteral('minutes'),
      isLiteral('hours'),
      isLiteral('days'),
      isLiteral('weeks'),
      isLiteral('months'),
      isLiteral('years')
    ),
  }),
  datePicker: isType({
    startDate: isUnion(isString, isLiteral(null)),
    endDate: isUnion(isString, isLiteral(null)),
  }),
});

export const isChatbotCurrentConversationId = isUnion(isString, isLiteral(null));

export const isSidebarWidth = isNumber;

export const isReportPanelWidth = isNumber;

export const isUserPreferences = isType({
  language: isString,
  notificationsEnabled: isOptional(isBoolean),
});

export const isAppSettings = isType({
  mockMode: isBoolean,
});

export const isFeatureFlags = isType({
  enableMockMode: isBoolean,
  enableFileUpload: isBoolean,
  enableDocumentManagement: isBoolean,
  enableLanguageSwitcher: isBoolean,
  enableDarkMode: isBoolean,
  enableAppDetails: isBoolean,
  enableContactUs: isBoolean,
});

const isHeaderButtonId = isUnion(
  isLiteral('theme'),
  isLiteral('language'),
  isLiteral('mockMode'),
  isLiteral('contact'),
  isLiteral('info'),
  isLiteral('swagger')
);

export const isHeaderButtonsOrder = isArray(isHeaderButtonId);

export const isAppVersion = isString;

export const localStorageGuards: {
  [K in LocalStorageKeys]: (value: unknown) => value is LocalStorageValues[K];
} = {
  'app-version': isAppVersion,
  'chatbot-sidebar-open': isChatbotSidebarOpen,
  'chatbot-theme-mode': isChatbotThemeMode,
  'chatbot-conversations': isChatbotConversations,
  'chatbot-current-conversation-id': isChatbotCurrentConversationId,
  'sidebar-width': isSidebarWidth,
  'report-panel-width': isReportPanelWidth,
  'enabled-tools': isEnabledTools,
  'tool-configurations': isToolConfigurations,
  'selected-countries': isSelectedCountries,
  'available-countries': isAvailableCountries,
  'date-range-settings': isDateRangeSettings,
  'user-preferences': isUserPreferences,
  'app-settings': isAppSettings,
  'header-buttons-order': isHeaderButtonsOrder,
  'feature-flags': isFeatureFlags,
};

export const isSessionToken = isString;

export const isTempData = isIndexRecord(isUnknown);

export const isFormState = isIndexRecord(isUnknown);

export const isCartItems = isArray(
  isType({
    id: isString,
    quantity: isNumber,
  })
);

export const isUserId = isUnion(isString, isLiteral(null));

export const isUserEmail = isUnion(isString, isLiteral(null));

export const isStreamingConversationId = isUnion(isString, isLiteral(null));

export const sessionStorageGuards: {
  [K in SessionStorageKeys]: (value: unknown) => value is SessionStorageValues[K];
} = {
  'session-token': isSessionToken,
  'user-id': isUserId,
  'user-email': isUserEmail,
  'streaming-conversation-id': isStreamingConversationId,
  'temp-data': isTempData,
  'form-state': isFormState,
  'cart-items': isCartItems,
};

export function validateLocalStorageKey<K extends LocalStorageKeys>(
  key: K,
  value: unknown,
  defaultValue: LocalStorageValues[K]
): value is LocalStorageValues[K] {
  const guard = localStorageGuards[key];
  if (guard(value)) {
    return true;
  }

  try {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    console.warn(`Invalid localStorage value for key "${key}". Reset to default value.`);
  } catch (error) {
    console.error(`Error resetting localStorage key "${key}":`, error);
  }

  return false;
}

export function validateSessionStorageKey<K extends SessionStorageKeys>(
  key: K,
  value: unknown,
  defaultValue: SessionStorageValues[K]
): value is SessionStorageValues[K] {
  const guard = sessionStorageGuards[key];
  if (guard(value)) {
    return true;
  }

  try {
    sessionStorage.setItem(key, JSON.stringify(defaultValue));
    console.warn(`Invalid sessionStorage value for key "${key}". Reset to default value.`);
  } catch (error) {
    console.error(`Error resetting sessionStorage key "${key}":`, error);
  }

  return false;
}

