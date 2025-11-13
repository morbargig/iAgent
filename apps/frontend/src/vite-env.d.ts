/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_API_UPLOAD_TIMEOUT?: string;
  readonly VITE_BASE_URL?: string;
  readonly VITE_ENABLE_MOCK_MODE?: string;
  readonly VITE_ENABLE_FILE_UPLOAD?: string;
  readonly VITE_ENABLE_DOCUMENT_MANAGEMENT?: string;
  readonly VITE_ENABLE_LANGUAGE_SWITCHER?: string;
  readonly VITE_ENABLE_DARK_MODE?: string;
  readonly VITE_ENABLE_APP_DETAILS?: string;
  readonly VITE_ENABLE_CONTACT_US?: string;
  readonly VITE_ENABLE_CONSOLE_LOG?: string;
  readonly VITE_LOG_LEVEL?: string;
}

declare const __BUILD_DATE__: string;
declare const __APP_VERSION__: string;

