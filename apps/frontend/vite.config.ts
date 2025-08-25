/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(({ mode }) => {
  // Determine base URL based on environment
  const isProduction = mode === 'production';
  const base = isProduction ? '/iAgent/' : '/';

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/frontend',

    server: {
      port: 4200,
      host: '0.0.0.0',
      watch: {
        // Prevent watching files that could cause infinite rebuilds
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/.nx/**',
          '**/coverage/**',
          '**/*.tsbuildinfo',
          '**/tmp/**'
        ]
      }
    },

    preview: {
      port: 4300,
      host: '0.0.0.0',
    },

    plugins: [react(), nxViteTsPaths()],

    css: {
      postcss: './postcss.config.js',
    },

    // Dynamic base URL configuration
    base: base,

    build: {
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
