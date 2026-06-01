import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true, // Prevent port conflicts by failing-fast if 3000 is occupied
    // Disable HMR WebSocket connection attempts completely in the sandboxed reverse-proxy to avoid 'Upgrade Required' issues
    hmr: false,
    // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
    watch: process.env.DISABLE_HMR === 'true' ? null : {
      usePolling: true,
      interval: 100,
    },
  }
});