import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      base: '/',   // Served at the root of a custom domain (directory
               // .healthmatters.clinic). The old repo-subpath base was left over from
               // teamhmc.github.io/<repo>/ hosting and made index.html request
               // /<repo>/assets/*.js, which 404s on the custom domain, so the app
               // never booted and the page rendered blank.
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-lucide': ['lucide-react'],
            }
          }
        }
      }
    };
});
