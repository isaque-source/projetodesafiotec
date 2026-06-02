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
    strictPort: true, 
    
    // Configuração corrigida para ambientes Cloud/Sandbox
    hmr: {
      protocol: 'wss',     // Força o uso de WebSocket Seguro
      clientPort: 443      // Faz o HMR passar pelo túnel do Proxy do seu ambiente
    },
    
    watch: process.env.DISABLE_HMR === 'true' ? null : {
      usePolling: true,
      interval: 100,
    },
  }
});