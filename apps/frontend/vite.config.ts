/// <reference types='vitest' />
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve } from 'path';
import { version } from './package.json';

const createEnvironmentPlugin = (mode: string): Plugin => {
  const getEnvironmentFile = () => {
    switch (mode) {
      case 'stage':
        return resolve(__dirname, 'src/environments/environment.stage.ts');
      case 'development':
        return resolve(__dirname, 'src/environments/environment.dev.ts');
      case 'production':
        return resolve(__dirname, 'src/environments/environment.prod.ts');
      default:
        return null;
    }
  };

  const environmentFile = getEnvironmentFile();

  if (!environmentFile) {
    return {
      name: 'environment-file-replacement',
    };
  }

  return {
    name: 'environment-file-replacement',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source) return null;
      
      // Match imports that end with 'environments/environment' (with or without .ts extension)
      // but exclude specific environment files (environment.dev.ts, environment.stage.ts, etc.)
      const isEnvironmentImport = 
        (source.endsWith('environments/environment') || 
         source.endsWith('environments/environment.ts')) &&
        !source.includes('environment.') &&
        !source.includes('environment.type') &&
        !source.includes('environment.base') &&
        !source.includes('environment.helper');
      
      if (isEnvironmentImport) {
        return environmentFile;
      }
      
      return null;
    },
  };
};

export default defineConfig(({ mode }) => {
  // Determine base URL based on environment
  const isProduction = mode === 'production';
  const base = isProduction ? '/iAgent/' : '/';

  // Import version from package.json (tree-shakeable)
  const buildDate = new Date().toISOString();

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/frontend',

    server: {
      port: parseInt(process.env.VITE_PORT || '3000', 10),
      host: process.env.VITE_HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'),
      allowedHosts: ['host.docker.internal'],
      watch: {
        // Prevent watching files that could cause infinite rebuilds
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/.nx/**',
          '**/coverage/**',
          '**/*.tsbuildinfo',
          '**/tmp/**',
          '**/*.spec.ts',
          '**/*.test.ts',
          '**/*.spec.tsx',
          '**/*.test.tsx',
          '**/__tests__/**',
          '**/__mocks__/**'
        ]
      }
    },

    preview: {
      port: parseInt(process.env.VITE_PREVIEW_PORT || '4300', 10),
      host: process.env.VITE_PREVIEW_HOST || process.env.VITE_HOST || '0.0.0.0',
    },

    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),
      nxViteTsPaths(),
      createEnvironmentPlugin(mode),
    ],

    define: {
      __BUILD_DATE__: JSON.stringify(buildDate),
      __APP_VERSION__: JSON.stringify(version),
      // Ensure React DevTools can detect development mode
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    },

    resolve: {
      conditions: ['@iagent/workspace', 'import', 'module', 'default'],
      alias: {
        '@iagent/chat-types': resolve(__dirname, '../../libs/chat-types/src/index.ts'),
        '@iagent/front-react': resolve(__dirname, '../../libs/front/react/src/index.ts'),
      },
    },

    css: {
      postcss: './postcss.config.cjs',
    },

    // Dynamic base URL configuration
    base: base,

    build: {
      target: 'es2020',
      cssTarget: 'chrome97',
      outDir: '../../dist/apps/frontend',
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      // Generate source maps for debugging (required for React DevTools)
      sourcemap: true,
      // Ensure development build for React DevTools in dev mode
      minify: mode === 'production',
      // Optimize for GitHub Pages
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          },
        },
      },
    },

    // Optional parity for dev transforms:
    esbuild: { target: 'es2020' },
    optimizeDeps: {
      esbuildOptions: { target: 'es2020' },
    },

    test: {
      globals: true,
      cache: {
        dir: '../../node_modules/.vitest',
      },
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

      reporters: ['default'],
      coverage: {
        reportsDirectory: '../../coverage/apps/frontend',
        provider: 'v8',
      },
    },
  };
});
