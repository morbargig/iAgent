/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_BASE_URL?: string;
  readonly VITE_ENABLE_MOCK_MODE?: string;
  readonly VITE_LOG_LEVEL?: string;
}

declare const __BUILD_DATE__: string;
declare const __APP_VERSION__: string;

