/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import path from 'path';
import { readFileSync } from 'fs';

export default defineConfig(({ mode }) => {
  // Determine base URL based on environment
  const isProduction = mode === 'production';
  const base = isProduction ? '/iAgent/' : '/';

  // Read version from package.json
  const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
  const version = packageJson.version;
  const buildDate = new Date().toISOString();

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/frontend',

    server: {
      port: 3000,
      host: '0.0.0.0',
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
      port: 4300,
      host: '0.0.0.0',
    },

    plugins: [
      react(),
      nxViteTsPaths(),
    ],

    define: {
      __BUILD_DATE__: JSON.stringify(buildDate),
      __APP_VERSION__: JSON.stringify(version),
    },

    resolve: {
      conditions: ['@iagent/workspace', 'import', 'module', 'default'],
      alias: {
        '@iagent/chat-types': path.resolve(__dirname, '../../libs/chat-types/src/index.ts'),
        '@iagent/front-react': path.resolve(__dirname, '../../libs/front/react/src/index.ts'),
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
      // Generate source maps for debugging
      sourcemap: true,
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
