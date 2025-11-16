export type TypeGuard<T> = (value: unknown) => value is T;

export type UseStorageReturn<T> = [
  T,
  (value: T | ((prev: T) => T)) => void,
  () => void
];

export type UseLocalStorageReturn<T> = [
  T,
  (value: T | ((prev: T) => T)) => void
];

export type HeaderButtonId = 'theme' | 'language' | 'mockMode' | 'contact' | 'info' | 'swagger';

export interface ToolConfiguration {
  toolId: string;
  enabled: boolean;
  parameters: {
    pages?: {
      selectedPages: string[];
      inclusionType?: 'include' | 'include_only' | 'exclude';
    };
    requiredWords?: string[];
    [key: string]: unknown;
  };
}

export interface DateRangeSettings {
  activeTab: number;
  committedTab: number;
  customRange: {
    amount: number;
    type: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
  };
  datePicker: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface LocalStorageValues {
  'app-version': string;
  'chatbot-sidebar-open': boolean;
  'chatbot-theme-mode': boolean;
  'chatbot-conversations': Array<{
    id: string;
    title?: string;
    messages?: unknown[];
    createdAt?: string;
    updatedAt?: string;
  }>;
  'chatbot-current-conversation-id': string | null;
  'sidebar-width': number;
  'report-panel-width': number;
  'enabled-tools': Record<string, boolean>;
  'tool-configurations': Record<string, ToolConfiguration>;
  'selected-countries': string[];
  'available-countries': Array<{
    code: string;
    flag: string;
    nameKey: string;
  }>;
  'date-range-settings': DateRangeSettings;
  'user-preferences': {
    language: string;
    notificationsEnabled?: boolean;
    [key: string]: unknown;
  };
  'app-settings': {
    mockMode: boolean;
    [key: string]: unknown;
  };
  'header-buttons-order': HeaderButtonId[];
  'feature-flags': {
    enableMockMode: boolean;
    enableFileUpload: boolean;
    enableDocumentManagement: boolean;
    enableLanguageSwitcher: boolean;
    enableDarkMode: boolean;
    enableAppDetails: boolean;
    enableContactUs: boolean;
  };
}

export type LocalStorageKeys = keyof LocalStorageValues;

export interface SessionStorageValues {
  'session-token': string;
  'user-id': string | null;
  'user-email': string | null;
  'streaming-conversation-id': string | null;
  'temp-data': Record<string, unknown>;
  'form-state': Record<string, unknown>;
  'cart-items': Array<{
    id: string;
    quantity: number;
    [key: string]: unknown;
  }>;
}

export type SessionStorageKeys = keyof SessionStorageValues;

export const localStorageDefaults: LocalStorageValues = {
  'app-version': '',
  'chatbot-sidebar-open': false,
  'chatbot-theme-mode': true,
  'chatbot-conversations': [],
  'chatbot-current-conversation-id': null,
  'sidebar-width': 250,
  'report-panel-width': 350,
  'enabled-tools': {},
  'tool-configurations': {},
  'selected-countries': ['DE', 'FR', 'IT', 'ES'],
  'available-countries': [
    { code: 'DE', flag: '🇩🇪', nameKey: 'countries.germany' },
    { code: 'FR', flag: '🇫🇷', nameKey: 'countries.france' },
    { code: 'IT', flag: '🇮🇹', nameKey: 'countries.italy' },
    { code: 'ES', flag: '🇪🇸', nameKey: 'countries.spain' },
    { code: 'GB', flag: '🇬🇧', nameKey: 'countries.united_kingdom' },
    { code: 'NL', flag: '🇳🇱', nameKey: 'countries.netherlands' },
    { code: 'BE', flag: '🇧🇪', nameKey: 'countries.belgium' },
    { code: 'PL', flag: '🇵🇱', nameKey: 'countries.poland' },
  ],
  'date-range-settings': {
    activeTab: 0,
    committedTab: 0,
    customRange: {
      amount: 1,
      type: 'months',
    },
    datePicker: {
      startDate: null,
      endDate: null,
    },
  },
  'user-preferences': {
    language: 'en',
  },
  'app-settings': {
    mockMode: true,
  },
  'header-buttons-order': ['theme', 'language', 'mockMode', 'contact', 'info', 'swagger'],
  'feature-flags': {
    enableMockMode: true,
    enableFileUpload: false,
    enableDocumentManagement: false,
    enableLanguageSwitcher: false,
    enableDarkMode: false,
    enableAppDetails: false,
    enableContactUs: false,
  },
};

export const sessionStorageDefaults: SessionStorageValues = {
  'session-token': '',
  'user-id': null,
  'user-email': null,
  'streaming-conversation-id': null,
  'temp-data': {},
  'form-state': {},
  'cart-items': [],
};

