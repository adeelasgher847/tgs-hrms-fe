/// <reference types="vitest/config" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr'; // ✅ SVG support
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Final merged config
export default defineConfig({
  plugins: [react(), svgr()], // 🟢 both react & svgr
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // 🔊 Dev server on LAN IP & stable HMR
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      host: '192.168.0.141',
      protocol: 'ws',
      port: 5173,
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
